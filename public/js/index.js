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

  var mySwiper = $('.swiper-container').swiper({
    //Your options here:
    mode: 'horizontal',
    pagination: '#navigation',
    paginationAsRange: true,
    paginationClickable: true,
    calculateHeight: true
    //etc..
  });

  $('.start-btn').click(function(){
    $('#cover').hide();
    $('#generation-choose').show();
  });

  $('#g80').click(function(){
    Local.generation = '80';
    $('#generation-choose').hide();
    $('#guess-game').show(initGame);
  });

  $('#g90').click(function(){
    Local.generation = '90';
    $('#generation-choose').hide();
    $('#guess-game').show(initGame);
  });

  var initGame = function(){
    $('#guess-game .ge').text(Local.generation);
  };

});
