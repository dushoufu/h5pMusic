/*
 * @author		javaSwing
 * @email		zxdlovejava@gmail.com
 * @date		2015-08-29
 * @project		h5pMusic
 * @description	基于html5和css3编写的音乐播发器
 */
$(function(){
    //一些基础变量
    var audio =$('#audio')[0];
    var MusicIndex = 0;
    var MusicList = [];
    var lrcData = [];
    var lrcParser = new LyricParser();

    //跨域得到别人的数据源
    //这里有一个问题？难道jquery对jsonp的封装不支持函数名调用，只能在success中使用？
    $.ajax({
            type: 'get',
            url: 'http://gerald.top/~music/163/playlist/66163538',
            async: false,
            jsonp: 'jsonp',//传递给请求处理程序或页面的，用以获得jsonp回调函数名的参数名(一般默认为:callback)
            jsonpCallback: 'init',//自定义的jsonp回调函数名称，默认为jQuery自动生成的随机函数名，也可以写"?"，jQuery会自动为你处理数据
            dataType: 'jsonp',
            success: function(data) {
                MusicList = data;
                initPlay(MusicIndex);
            },
            error: function() {
                alert('程序出错！');
            }
        });


    /**
     * 初始化播放器
     * @param index 当前歌曲索引
     */
    function initPlay(index) {
        audio.volume = 0.5;
        audio.addEventListener('progress',bufferMusic,false);
        audio.setAttribute('src',MusicList[index]['url']);
        $.ajax({
            type: 'get',
            url: 'http://gerald.top/~music/163/lyric/'+encodeURIComponent(MusicList[index]['id']),
            async: false,
            jsonp: 'jsonp',//传递给请求处理程序或页面的，用以获得jsonp回调函数名的参数名(一般默认为:callback)
            jsonpCallback: 'getLrc',//自定义的jsonp回调函数名称，默认为jQuery自动生成的随机函数名，也可以写"?"，jQuery会自动为你处理数据
            dataType: 'jsonp',
            success: function(data) {
                lrcData = data['lyric'];
                console.debug(lrcData);
            },
            error: function() {
                alert('歌曲加载出错！');
            }
        });
        audio.play();
        $('.h5p-title').text(MusicList[index]['name']);
        $('.h5p-artist').text(MusicList[index]['artist']);
        $('.h5p-cover img').attr('src',MusicList[index]['image']['normal']);
        $('.current-time').text('00:00');
        $('.all-time').text('00:00');
        $('.h5p-lrc').text('');
        var allTime = parseInt(MusicList[index]['duration']);
        $('.all-time').text(formatTime(allTime/1000));
        $('.h5p-progress .base-bar .process-bar').css('width',0);
        $('.h5p-progress .base-bar .ready-bar').css('width',0);
    }

    //===================================================播放器按钮功能事件
    $('#play').click(function(){    //播放事件
        if(audio.paused) {
            audio.play();
        }else {
            audio.pause();
        }
    });

    //调整声音事件
    $('.h5p-volume .base-bar').mouseup(function(e){
        var poX = e.clientX;
        var targetX = $(this).offset().left;
        var TarVolume = ((poX - targetX)/65).toFixed(2);
        TarVolume > 1 && (TarVolume =1);
        TarVolume < 0 && (TarVolume =0);
        audio.volume = TarVolume;
        var percentage = TarVolume *100;
        $('.h5p-volume .process-bar').css('width', percentage +'%');
        percentage > 89 && (percentage =89); //为了让拖动块不被隐藏
        percentage < 7  && (percentage = 7);
        $('.slider').css('left',(percentage-7)+'%');
    });

    //拖动事件
    $('.slider').mousedown(starDrog=function(e){
        e.preventDefault();
        var orignLeft = $(this).position().left;    //滑块的初始位置
        var orignX = e.clientX;                     //鼠标的初始位置
        //拖动时的事件
        $(document).mousemove(doDrog=function(e){
            e.preventDefault();
            var moveX = e.clientX -orignX;  //鼠标移动的距离
            var currentLeft = orignLeft + moveX;
            var preVolume = (currentLeft /65).toFixed(2);
            preVolume > 1 && (preVolume =1);
            preVolume <0 && (preVolume =0);
            audio.volume = preVolume;
            var percentage = preVolume *100;
            $('.h5p-volume .process-bar').css('width', percentage +'%');
            percentage > 89 && (percentage =89); //为了让拖动块不被隐藏
            percentage < 7  && (percentage = 7);
            $('.slider').css('left',(percentage-7)+'%');
        });
        //拖动结束解除事件
        $(document).mouseup(stopDrog=function(e){
            $(document).unbind("mouseup",stopDrog);
            $(document).unbind("mousemove",doDrog);
        });
    });

    //歌曲播放进度的调整
    $('.h5p-progress .base-bar').mousedown(function(e){
        var poX = e.clientX;
        console.debug("poX: "+ poX);
        var targetLeft = $(this).offset().left;
        console.debug("targetLeft: " + targetLeft);
        var percentage = (poX - targetLeft)/360 *100;   //时间改变有问题
        audio.currentTime = audio.duration*percentage/100;
    });

    //下一首
    $('#next').click(function(){
        var MusicNum = MusicList.length;
        ++MusicIndex > MusicNum -1 && (MusicIndex= 0);
        initPlay(MusicIndex);
    });

    //上一首
    $("#prev").click(function(){
        var MusicNum = MusicList.length;
        --MusicIndex <0 &&(MusicIndex = MusicList.length-1);
        initPlay(MusicIndex);
    });


    //播放器播放时事件
    $(audio).bind('play',function(){
        $('#play').removeClass('btn-play').addClass('btn-pause');
    });

    $(audio).bind('pause',function(){
        $('#play').removeClass('btn-pause').addClass('btn-play');
    });

    $(audio).bind('ended',function(){
        $('#next').triggerHandler('click');
    });


    /**
     * 缓冲音乐时调用的事件
     */
    function bufferMusic(){
        if(!audio) return;
        if(audio.buffered.length ==1) {
            // only one range
            if(audio.buffered.start(0) == 0) {
                var buffered = audio.buffered.end(0);
                var percentage = buffered/audio.duration*100;
                $('.h5p-progress .base-bar .ready-bar').css('width',percentage+'%');
            }
        }
    }

    //播放器播放时，更新进度事件
    audio.addEventListener('timeupdate',function(){
        if (!isNaN(audio.duration)) {
            //当前播放时间
            $('.current-time')[0].innerHTML = formatTime(audio.currentTime);
            //播放进度条
            var percentage = audio.currentTime/audio.duration*100;
            lrcParser.setLyric(lrcData);
            $('.h5p-lrc').text(lrcParser.getLyricAtTime(audio.currentTime));
            $('.h5p-progress .base-bar .process-bar').css('width',percentage+'%');
        };
    },false);

/*========================================功能函数区=========================*/
    /**
     * 时间格式化函数
     * @param s 要格式化的时间单位：s
     */
    function formatTime(s) {
        if(isNaN(s)) return '??:??';
        var m = Math.floor(s / 60);
        s = Math.floor(s) % 60;
        if(s < 10) s = '0' + s;
        if(m < 10) m = '0' + m;
        return m + ':' + s;
    }

});