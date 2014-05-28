/* jshint undef: true, unused: true */
/* jshint expr: true, boss: true */
/* jshint browser: true, devel: true, jquery: true*/

var Q = window.Q || {};

Q.photoUrl = '';

Q.d = function(x, y) {
    return '/dx/' + x + '/dy/' + y + '/gravity/NorthWest';
};

Q.text = function(str, font, size, color, dx, dy) {
    var t = Q.encode(str),
        f = Q.encode(font),
        c = Q.encode(color);
    return '/text/' + t + '/font/' + f + '/fontsize/' + size * 20 + '/fill/' + c + Q.d(dx, dy);
};

Q.t = function(str, dx, dy, fontsize) {
    return Q.text(str, '微软雅黑', fontsize, 'black', dx, dy);
};

Q.image = function(url, dx, dy) {
    return '/image/' + Q.encode(url) + Q.d(dx, dy);
};

// Q.initPluploader = function(browse_button_id, container_id, progress_id, error_id) {
//     var uploader = new plupload.Uploader({
//         runtimes: 'html5,flash,silverlight,html4',
//         browse_button: document.getElementById(browse_button_id),
//         container: document.getElementById(container_id),
//         max_file_size: '100mb',
//         url: 'http://up.qiniu.com',
//         flash_swf_url: 'js/plupload/Moxie.swf',
//         silverlight_xap_url: 'js/plupload/Moxie.xap',
//         multi_selection: false,
//         filters: {
//             mime_types: [{
//                 title: "Image files",
//                 extensions: "jpg,gif,png"
//             }]
//         },
//         multipart: true,
//         multipart_params: {
//             key: '',
//             token: ''
//         }
//     });

//     uploader.bind('Init', function(up, params) {
//         //显示当前上传方式，调试用
//         $.ajax({
//             url: '/token',
//             type: 'GET',
//             cache: false,
//             success: function(data) {
//                 if (data && data.token) {
//                     up.settings.multipart_params.token = data.token;
//                 }
//             },
//             error: function(error) {
//                 console.log(error);
//             }
//         });
//     });
//     uploader.init();

//     uploader.bind('FilesAdded', function(up, files) {
//         up.start();
//         up.refresh(); // Reposition Flash/Silverlight
//     });

//     uploader.bind('BeforeUpload', function(up, file) {
//         var prefix = '';
//         switch (browse_button_id) {
//             case 'uploadAvatar':
//                 prefix = 'avatar/';
//                 break;
//             case 'uploadPhoto':
//                 prefix = 'photo/';
//                 break;
//             case 'upload-btn':
//                 prefix = 'photo/';
//                 break;
//             default:
//                 prefix = 'default/';
//         }
//         $('#photo-preview').hide();
//         $('#upload-btn').find('span').text('上传中...');
//         prefix += (new Date()).valueOf() + '/';
//         up.settings.multipart_params.key = prefix + file.name;
//     });

//     uploader.bind('UploadProgress', function(up, file) {
//         document.getElementById(progress_id).innerHTML = file.percent + "%," + up.total.bytesPerSec;
//     });

//     uploader.bind('Error', function(up, err) {
//         document.getElementById(error_id).innerHTML += "\nError #" + err.code + ": " + err.message;
//         up.refresh(); // Reposition Flash/Silverlight
//     });


//     uploader.bind('FileUploaded', function(up, file, info) {
//         var res = $.parseJSON(info.response);
//         var link = 'http://hc61.qiniudn.com/';
//         Q.photoUrl = link + res.key;
//         $('#photo-preview').attr('src', Q.photoUrl + '-32221').show();
//         $('#upload-btn').find('span').text('点击重新上传');
//         // document.getElementById(progress_id).innerHTML = '上传成功';
//         document.getElementById(progress_id).innerHTML = '';
//     });
// };

// Q.setPhoto = function(url) {
//     Q.photoUrl = url;
//     if (!Q.photoUrl) {
//         $('.photo-preview-wrapper').hide();
//         return;
//     }
//     $('.photo-preview-wrapper').show().find('.info-text').text('加载中...');
//     Q.imgReady(Q.photoUrl, function() {
//         Q.photoSize.width = this.width;
//         Q.photoSize.height = this.height;
//     }, function() {
//         $('.photo-preview-wrapper').find('.info-text').text('预览：');
//         $('.photo-preview-wrapper').find('#photo-preview').attr('src', Q.photoUrl);
//     }, null);
// };

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

    var SHARE_TEXT = '#猿忆童年# 那时候最幸福就是一边吃着娃娃头雪糕，玩着心爱的红白机或者386! 想要自己开发游戏，小光盘承载着少年的梦想与美好回忆，从过去到现在，我们一直在努力，为了理想做到更好！程序员，在这里找回你的童年！游戏传送门：http://61.qiniu.io';

    var steps = [
        '#generation-choose',
        '#init-game',
        '#guess-game',
        '#upload',
        '#select-template'
    ];

    var h = window.innerHeight,
        w = window.innerWidth;

    $('#cover').css('width', w);
    $('#cover').css('height', h);

    var bgsrc = '../img/4.png';
    Q.imgReady(bgsrc, function() {}, function() {
        $('#bg').attr('src', bgsrc);
        // var bgw = $('#bg').width();
        var bgw = 640 / 1136 * h;
        $('#bg').css('marginLeft', -(bgw / 2));

        for (var i = 0; i < steps.length; i++) {
            var b = $(steps[i]);
            b.css('height', h);
            b.css('width', bgw);
            b.css('marginLeft', -(bgw / 2));
        }
    }, null);

    var dn = 'http://hc61.qiniudn.com/';

    // Q.initPluploader('upload-btn', 'uploader-wrapper', 'progress', 'error');

    var genWeiboShareLink = function(text, templUrl) {
        var ShareText = encodeURIComponent(text);
        // if (result === 'none') {
        //     ShareText = encodeURIComponent('#牛头不对马嘴# 参与了七牛云存储的送土豪大礼的活动，等着土豪金，ipad, 机械键盘到我碗里来。小伙伴们转发我这条微博也有机会获得限量版男女牛小七公仔以及七牛笔记本一套！');
        // } else {
        //     ShareText = encodeURIComponent('#牛头不对马嘴# 一不小心在七牛云存储的活动中中奖了，一定要晒晒我的好手气！还要继续抽，土豪金，ipad，机械键盘快到碗里来哈。小伙伴们，转发我这条微博也有机会获得限量版男女牛小七公仔以及七牛笔记本一套！');
        // }
        var picUrl = encodeURIComponent(templUrl);
        // var picUrl = encodeURIComponent('http://qiniu-images.qiniudn.com/newyear/newyear-weibo.png');
        // var url = encodeURIComponent('http://61.qiniu.io');
        var url = encodeURIComponent('http://61.qiniu.io');
        return 'http://service.weibo.com/share/share.php?url=' + url + '&type=button&ralateUid=2651079901&language=zh_cn&appkey=3084908017&title=' + ShareText + '&pic=' + picUrl + '&searchPic=false&style=simple';
    };

    $('.swiper-container').swiper({
        //Your options here:
        mode: 'horizontal',
        pagination: '#navigation',
        paginationAsRange: true,
        paginationClickable: true,
        calculateHeight: true,
        keyboardControl: true,
        mousewheelControl: true
        // cssWidthAndHeight: true
        //etc..
    });

    $('#gc').click(function() {
        $('#cover').hide(0);
        $('#generation-choose').show(0);
        $('#bg').show(0);
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

    var g80Pre = dn + 'g801/',
        g90Pre = dn + 'g90/',
        suf1 = '-3005';
    var allQuestions = {
        g80: [{
            imgurl: g80Pre + '1.jpg',
            answer: '拍纸片'
        }, {
            imgurl: g80Pre + '2.png',
            answer: '俄罗斯方块'
        }, {
            imgurl: g80Pre + '3.jpg',
            answer: '撞拐'
        }, {
            imgurl: g80Pre + '4.jpg',
            answer: 'MSDOS'
        }, {
            imgurl: g80Pre + '5.jpg',
            answer: 'penmac'
        }, {
            imgurl: g80Pre + '6.jpg',
            answer: 'appleII'
        }, {
            imgurl: g80Pre + '7.jpg',
            answer: '棉花糖'
        }, {
            imgurl: g80Pre + '8.jpg',
            answer: '娃娃头雪糕'
        }, {
            imgurl: g80Pre + '9.jpg',
            answer: '变形金刚'
        }, {
            imgurl: g80Pre + '10.jpg',
            answer: '巴巴爸爸'
        }, {
            imgurl: g80Pre + '11.jpg',
            answer: '希瑞'
        }, {
            imgurl: g80Pre + '12.jpg',
            answer: '圣斗士星矢'
        }, {
            imgurl: g80Pre + '13.jpg',
            answer: '阿凡提'
        }, {
            imgurl: g80Pre + '14.jpg',
            answer: '爆米花'
        }, {
            imgurl: g80Pre + '15.jpeg',
            answer: '拨浪鼓'
        }],
        g90: [{
            imgurl: g90Pre + '1.jpeg',
            answer: '东南西北'
        }, {
            imgurl: g90Pre + '2.jpg',
            answer: 'windows98'
        }, {
            imgurl: g90Pre + '3.jpg',
            answer: '机器猫'
        }, {
            imgurl: g90Pre + '4.jpg',
            answer: '红白机'
        }, {
            imgurl: g90Pre + '5.jpg',
            answer: '魂斗罗'
        }, {
            imgurl: g90Pre + '6.jpg',
            answer: '超级玛丽'
        }, {
            imgurl: g90Pre + '7.jpg',
            answer: '大大泡泡糖'
        }, {
            imgurl: g90Pre + '8.jpg',
            answer: '拍卡'
        }, {
            imgurl: g90Pre + '9.jpg',
            answer: '飞行棋'
        }, {
            imgurl: g90Pre + '10.jpg',
            answer: '忍者神龟'
        }, {
            imgurl: g90Pre + '11.jpg',
            answer: '弹玻璃球'
        }, {
            imgurl: g90Pre + '12.jpg',
            answer: '小浣熊干脆面'
        }, {
            imgurl: g90Pre + '13.png',
            answer: '娃哈哈AD钙奶'
        }, {
            imgurl: g90Pre + '14.gif',
            answer: '386'
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
        var ret = l.slice(0, 2);
        // console.log([ret[0].imgurl, ret[1].imgurl, ret[2].imgurl, ret[3].imgurl]);
        questionGroup = ret;

        var p = $('#img-puzzle-group');
        p.find('.tl').attr('src', ret[0].imgurl + suf1);
        p.find('.tr').attr('src', ret[1].imgurl + suf1);
        // p.find('.bl').attr('src', ret[2].imgurl + suf1);
        // p.find('.br').attr('src', ret[3].imgurl + suf1);

        return ret;
    };

    $('#reset-group').click(randomQuestionGroup);

    var allLen = 2;
    var pass = 1;
    // var passUrl = [];

    var initGame = function() {
        pass = 1;
        setGuess();
    };

    var setGuess = function() {
        $('#guess-game').find('.pg').text(pass + '/' + allLen);
        var question = questionGroup[pass - 1];

        $('#guess-game').find('.main-pic').attr('src', question.imgurl + suf1);

        var tmplInput = $('<input type="text" maxlength="1" class="charactor">');
        var tmplMask = $('<span class="charactor"></span>');
        var cs = $('<div class="answers-wrapper"></div>');

        var len = 0;
        // var cur = 0;

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
        $('#guess-game').find('.answers-wrapper').find('input:first').focus();
    };

    $('#return').click(function() {
        $('#guess-game').hide(0);
        $('#init-game').show(0);
        randomQuestionGroup();
    });

    var canCheck = true;

    var checkAnswer = function() {
        if (canCheck) {
            var a = '';
            $('#guess-game').find('.charactor').each(function() {
                if ($(this).is('input')) {
                    a += $(this).val();
                } else {
                    a += $(this).text();
                }
            });
            if (a.toLowerCase() !== questionGroup[pass - 1].answer.toLowerCase()) {
                // $('#f-err').show();
                $('#err-mask').show(0);
                return;
            }
            $('#f-err').hide();
            pass += 1;
            if (pass <= allLen) {
                canCheck = false;
                // $('#main-mask').show(0, function() {
                //     window.setTimeout(function() {
                //         $('#main-mask').hide();
                //         canCheck = true;
                //         setGuess();
                //     }, 1000);
                // });
                setGuess();
                canCheck = true;
                return;
            }
            canCheck = false;
            $('#pass-mask').show(0);
            // alert('all clear');
            $('#guess-game').find('.btn-line').html('');
            $('#guess-game').find('.btn-line').append('<button id="start-upload" class="btn btn-lg btn-main"><img src="img/start-upload.png" class="btn-img"></button>');
        }
    };

    $('#guess-game .answer-line').on('focus', 'input.charactor', function() {
        $('#err-mask').hide();
    });

    $('#check').click(checkAnswer);

    $('body').on('keypress', function(e) {
        if (e.keyCode === 13) {
            checkAnswer();
        }
    });

    // $('body').on('click', '#start-upload', function() {
    //     $('#guess-game').hide(0);
    //     $('#upload').show(0);
    // });

    // $('#next-select').click(function() {
    //     // if (Q.photoUrl !== '') {
    //     $('#upload').hide(0);
    //     $('#select-template').show(0);
    //     loadTmpl(0);
    //     // } else {
    //     // alert('请上传您的照片');
    //     // }
    // });

    $('body').on('click', '#start-upload', function() {
        $('#guess-game').hide(0);
        $('#pass-mask').hide(0);
        $('#select-template').show(0, function() {
            $('#save-tip').css('top', 0);
        });
        loadTmpl(0);
    });

    // var amap = [
    //     [499, 281],
    //     [326, 366],
    //     [362, 174]
    // ];
    // var tmap = [
    //     [
    //         [409, 26],
    //         [763, 102],
    //         [167, 390],
    //         [836, 420]
    //     ],
    //     [
    //         [326, 46],
    //         [16, 201],
    //         [16, 475],
    //         [16, 758]
    //     ],
    //     [
    //         [80, 50],
    //         [529, 22],
    //         [818, 114],
    //         [818, 346]
    //     ]
    // ];

    // var pmap = [2, 2, 2];
    // var tmplNum = 0;
    // Q.photoUrl = 'http://happy20140601.qiniudn.com/photo/1401160133645/ava.jpg';

    var l1 = function() {
        var r = '';
        r += Q.image(questionGroup[0].imgurl + '-42311', 102, 121);
        r += Q.image(questionGroup[1].imgurl + '-32221', 25, 540);
        r += Q.t(questionGroup[0].answer, 101, 450, 30);
        r += Q.t(questionGroup[1].answer, 24, 778, 30);
        return r;
    };

    var l2 = function() {
        var r = '';
        r += Q.image(questionGroup[0].imgurl + '-32221', 525, 68);
        r += Q.image(questionGroup[1].imgurl + '-32221', 525, 372);
        r += Q.t(questionGroup[0].answer, 525, 26, 30);
        r += Q.t(questionGroup[1].answer, 525, 325, 30);
        return r;
    };

    var l3 = function() {
        var r = '';
        r += Q.image(questionGroup[0].imgurl + '-32221', 180, 97);
        r += Q.image(questionGroup[1].imgurl + '-32221', 566, 216);
        r += Q.t(questionGroup[0].answer, 180, 340, 30);
        r += Q.t(questionGroup[1].answer, 566, 160, 30);
        return r;
    };

    // var tSuf = '-32221';

    var buildWatermark = function(n) {
        if (n === 0) {
            return l1();
        }
        if (n == 1) {
            return l2();
        }
        if (n == 2) {
            return l3();
        }
        // var p = tmap[n];
        // var ret = '';
        // for (var i = 0; i < allLen; i++) {
        //     ret += Q.image(questionGroup[i].imgurl + tSuf, p[i][0], p[i][1]);
        // }
        // if (Q.photoUrl !== '') {
        //     ret += Q.image(Q.photoUrl + tSuf, amap[n][0], amap[n][1]);
        // }
        // return ret;
    };

    // var finalUrl = '';

    var loadTmpl = function(n) {
        var turl = ['m1.png', 'm2.jpg', 'm3.png'];
        var mainUrl = dn + turl[n];
        $('#m-template').hide();
        $('#select-template').find('#m-temp-line').find('span').show().text('生成中...');
        mainUrl += '?watermark/3' + buildWatermark(n);
        Q.imgReady(mainUrl, function() {
            $('#select-template').find('#m-temp-line').find('span').text('加载中...');
        }, function() {
            $('#m-template').attr('src', mainUrl);
            $('#save').attr('href', mainUrl + '&download');
            $('#select-template').find('#m-temp-line').find('span').hide();
            $('#m-template').show();
        }, null);

        // finalUrl = mainUrl + '&download';
        $('#share').attr('href', genWeiboShareLink(SHARE_TEXT, mainUrl));
        // $('#m-template').attr('src', mainUrl);
        // $('#save').attr('href', mainUrl + '&download');
    };

    $('.tmpl-btn').click(function() {
        var n = $(this).data('num');
        if (n !== 0) {
            $('#select-template').find('#m-temp-line').addClass('h');
        } else {
            $('#select-template').find('#m-temp-line').removeClass('h');
        }
        $('.tmpl-btn').removeClass('active');
        $(this).addClass('active');
        loadTmpl(n);
    });

    $('#retry').click(function() {
        // window.location.reload();
        $('#select-template').hide(0);
        $('#generation-choose').show(0);
    });

});
