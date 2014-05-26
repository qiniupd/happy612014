/* jshint undef: true, unused: true */
/* jshint expr: true, boss: true */
/* jshint browser: true, devel: true, jquery: true*/
/* global plupload*/

var Q = window.Q || {};

Q.initPluploader = function(browse_button_id, container_id, progress_id, error_id) {
    var uploader = new plupload.Uploader({
        runtimes: 'html5,flash,silverlight,html4',
        browse_button: document.getElementById(browse_button_id),
        container: document.getElementById(container_id),
        max_file_size: '100mb',
        url: 'http://up.qiniu.com',
        flash_swf_url: 'js/plupload/Moxie.swf',
        silverlight_xap_url: 'js/plupload/Moxie.xap',
        multi_selection: false,
        filters: {
            mime_types: [{
                title: "Image files",
                extensions: "jpg,gif,png"
            }]
        },
        multipart: true,
        multipart_params: {
            key: '',
            token: ''
        }
    });

    uploader.bind('Init', function(up, params) {
        //显示当前上传方式，调试用
        $.ajax({
            url: '/token',
            type: 'GET',
            cache: false,
            success: function(data) {
                if (data && data.token) {
                    up.settings.multipart_params.token = data.token;
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
    });
    uploader.init();

    uploader.bind('FilesAdded', function(up, files) {
        up.start();
        up.refresh(); // Reposition Flash/Silverlight
    });

    uploader.bind('BeforeUpload', function(up, file) {
        var prefix = '';
        switch (browse_button_id) {
            case 'uploadAvatar':
                prefix = 'avatar/';
                break;
            case 'uploadPhoto':
                prefix = 'photo/';
                break;
            default:
                prefix = 'default/';
        }
        prefix += (new Date()).valueOf() + '/';
        up.settings.multipart_params.key = prefix + file.name;
    });

    uploader.bind('UploadProgress', function(up, file) {
        document.getElementById(progress_id).innerHTML = file.percent + "%," + up.total.bytesPerSec;
    });

    uploader.bind('Error', function(up, err) {
        document.getElementById(error_id).innerHTML += "\nError #" + err.code + ": " + err.message;
        up.refresh(); // Reposition Flash/Silverlight
    });


    uploader.bind('FileUploaded', function(up, file, info) {
        var res = $.parseJSON(info.response);
        var link = 'http://zblq.qiniudn.com/';
        if (res.key.indexOf('avatar/') > -1) {
            Q.avatarUrl = link + res.key;
            $('#avatar-preview').attr('src', Q.avatarUrl + '-ava');
        } else if (res.key.indexOf('photo/') > -1) {
            Q.setPhoto(link + res.key);
        }
        document.getElementById(progress_id).innerHTML = '上传成功';
    });
};

Q.setPhoto = function(url) {
    Q.photoUrl = url;
    if (!Q.photoUrl) {
        $('.photo-preview-wrapper').hide();
        return;
    }
    $('.photo-preview-wrapper').show().find('.info-text').text('加载中...');
    Q.imgReady(Q.photoUrl, function() {
        Q.photoSize.width = this.width;
        Q.photoSize.height = this.height;
    }, function() {
        $('.photo-preview-wrapper').find('.info-text').text('预览：');
        $('.photo-preview-wrapper').find('#photo-preview').attr('src', Q.photoUrl);
    }, null);
};

Q.imgReady = (function() {
    var list = [],
        intervalId = null,

        // 用来执行队列
        tick = function() {
            var i = 0;
            for (; i < list.length; i++) {
                list[i].end ? list.splice(i--, 1) : list[i]();
            }
            (!list.length) && stop();
        },

        // 停止所有定时器队列
        stop = function() {
            clearInterval(intervalId);
            intervalId = null;
        };

    return function(url, ready, load, error) {
        var onready, width, height, newWidth, newHeight,
            img = new Image();
        img.src = url;

        // 如果图片被缓存，则直接返回缓存数据
        if (img.complete) {
            ready.call(img);
            load && load.call(img);
            return;
        }

        width = img.width;
        height = img.height;

        // 加载错误后的事件
        img.onerror = function() {
            error && error.call(img);
            onready.end = true;
            img = img.onload = img.onerror = null;
        };

        // 图片尺寸就绪
        onready = function() {
            newWidth = img.width;
            newHeight = img.height;
            if (newWidth !== width || newHeight !== height ||
                // 如果图片已经在其他地方加载可使用面积检测
                newWidth * newHeight > 1024
            ) {
                ready.call(img);
                onready.end = true;
            }
        };
        onready();

        // 完全加载完毕的事件
        img.onload = function() {
            // onload在定时器时间差范围内可能比onready快
            // 这里进行检查并保证onready优先执行
            !onready.end && onready();
            load && load.call(img);
            // IE gif动画会循环执行onload，置空onload即可
            img = img.onload = img.onerror = null;
        };

        // 加入队列中定期执行
        if (!onready.end) {
            list.push(onready);
            // 无论何时只允许出现一个定时器，减少浏览器性能损耗
            if (intervalId === null) intervalId = setInterval(tick, 40);
        }
    };
})();

var Local = window.Local || {};
Local.generation = '';

$(function() {
    Q.initPluploader('upload-btn', 'uploader-wrapper', 'progress', 'error');

    $('.swiper-container').swiper({
        //Your options here:
        mode: 'horizontal',
        pagination: '#navigation',
        paginationAsRange: true,
        paginationClickable: true,
        calculateHeight: true
        //etc..
    });

    $('#gc').click(function() {
        $('#cover').hide(0);
        $('#generation-choose').show(0);
    });

    var generation = '';
    var questionGroup = [];

    $('#g80').click(function() {
        generation = 'g80';
        $('#generation-choose').hide(0);
        $('#init-game').show(0, randomQuestionGroup);
    });

    $('#g90').click(function() {
        generation = 'g90';
        $('#generation-choose').hide(0);
        $('#init-game').show(0, randomQuestionGroup);
    });

    $('#start-guess').click(function() {
        $('#init-game').hide(0);
        $('#guess-game').show(0, initGame);
    });

    var allQuestions = {
        g80: [{
            imgurl: '/img/80/1.jpg',
            answer: '拍纸片'
        }, {
            imgurl: '/img/80/2.png',
            answer: '俄罗斯方块'
        }, {
            imgurl: '/img/80/3.jpg',
            answer: '撞拐'
        }, {
            imgurl: '/img/80/4.jpg',
            answer: 'MSDOS'
        }, {
            imgurl: '/img/80/5.jpg',
            answer: 'penmac'
        }, {
            imgurl: '/img/80/6.jpg',
            answer: 'commodore64p'
        }, {
            imgurl: '/img/80/7.jpg',
            answer: '棉花糖'
        }, {
            imgurl: '/img/80/8.jpg',
            answer: '娃娃头雪糕'
        }, {
            imgurl: '/img/80/9.jpg',
            answer: '变形金刚'
        }, {
            imgurl: '/img/80/10.jpg',
            answer: '巴巴爸爸'
        }, {
            imgurl: '/img/80/11.jpg',
            answer: '希瑞'
        }, {
            imgurl: '/img/80/12.jpg',
            answer: '圣斗士星矢'
        }, {
            imgurl: '/img/80/13.jpg',
            answer: '阿凡提'
        }, {
            imgurl: '/img/80/14.jpg',
            answer: '爆米花'
        }, {
            imgurl: '/img/80/15.jpeg',
            answer: '拨浪鼓'
        }],
        g90: [{
            imgurl: '90-1',
            answer: 'abcd'
        }, {
            imgurl: '90-2',
            answer: 'abcd'
        }, {
            imgurl: '90-3',
            answer: 'abcd'
        }, {
            imgurl: '90-4',
            answer: 'abcd'
        }, {
            imgurl: '90-5',
            answer: 'abcd'
        }, {
            imgurl: '90-6',
            answer: 'abcd'
        }, {
            imgurl: '90-7',
            answer: 'abcd'
        }, {
            imgurl: '90-8',
            answer: 'abcd'
        }, {
            imgurl: '90-9',
            answer: 'abcd'
        }, {
            imgurl: '90-10',
            answer: 'abcd'
        }]
    };

    var randomQuestionGroup = function() {
        var l = allQuestions[generation];
        for (var i = l.length - 1; i > 0; i--) {
            var index = Math.floor(Math.random() * i);
            var t = l[index];
            l[index] = l[i];
            l[i] = t;
        }
        var ret = l.slice(0, 4);
        console.log([ret[0].imgurl, ret[1].imgurl, ret[2].imgurl, ret[3].imgurl]);
        questionGroup = ret;

        var p = $('#img-puzzle-group');
        p.find('.tl').attr('src', ret[0].imgurl);
        p.find('.tr').attr('src', ret[1].imgurl);
        p.find('.bl').attr('src', ret[2].imgurl);
        p.find('.br').attr('src', ret[3].imgurl);

        return ret;
    };

    $('#reset-group').click(randomQuestionGroup);

    var allLen = 4;
    var pass = 1;
    // var passUrl = [];

    var initGame = function() {
        allLen = 4;
        pass = 1;
        setGuess();
    };

    var setGuess = function() {
        $('.progress').text(pass + '/' + allLen);
        var question = questionGroup[pass - 1];

        $('#guess-game').find('.main-pic').attr('src', question.imgurl);

        var tmplInput = $('<input type="text" class="charactor">');
        var tmplMask = $('<span class="charactor"></span>');
        var cs = $('<div class="answers-wrapper"></div>');

        var len = 0;
        var cur = 0;

        for (var i = 0; i < question.answer.length; i++) {
            if (i % 2 == 1) {
                var eleSpan = tmplMask.clone();
                eleSpan.text(question.answer[i]);
                cs.append(eleSpan);
            } else {
                len++;
                var eleIn = tmplInput.clone();
                cs.append(eleIn);
            }
        }
        // debugger;
        $('#guess-game').find('.answer-line').html('');
        $('#guess-game').find('.answer-line').append(cs);
    };

    $('#check').click(function() {
        var a = '';
        $('#guess-game').find('.charactor').each(function() {
            if ($(this).is('input')) {
                a += $(this).val();
            } else {
                a += $(this).text();
            }
        });
        if (a !== questionGroup[pass - 1].answer) {
            alert('Naive');
            return;
        }
        pass += 1;
        if (pass <= allLen) {
            setGuess();
            return;
        }
        alert('all clear');
        $('#guess-game').find('.btn-line').html('');
        $('#guess-game').find('.btn-line').append('<button id="start-upload" class="btn">生成明信片</button>');
    });

    $('body').on('click', '#start-upload', function() {
        $('#guess-game').hide(0);
        $('#upload').show(0);
    });

    $('#next-select').click(function() {
        $('#upload').hide(0);
        $('#select-template').show(0);
    });

    // var passGuess = function() {
    //     pass++;
    //     if (pass > allLen) {
    //         $('body').trigger('allPass');
    //     } else {
    //         setGuess();
    //     }
    // };

    // $('body').on('allPass', function() {
    //     alert('all pass');
    //     $('#guess-game').hide(0);
    //     $('#final-present').show(0, initGame);
    // });
    
    $('#gc').click();
    // $('#g80').click();
    // $('#start-guess').click();
});
