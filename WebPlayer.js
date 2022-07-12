/**
 * WebPlayer.js
 * web components video player
 * v1.0.1
 */
class WebPlayer extends HTMLElement{
    _getStyle(){
        return `
        <style>
            *{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI',Arial,'Microsoft Yahei',sans-serif;
            }
            .web-player{
                background-color: #000;
                color: #fff;
                width: 100%;
                height: 100%;
                position: relative;
                cursor: pointer;
                user-select: none;
                outline: none;
            }
            .web-player .video{
                display: flex;
                position: absolute;
                width: 100%;
                max-height: 100%;
                top:0;
                left: 0;
                bottom: 0;
                right: 0;
            }
            .web-player .control-main{
                display: flex;
                align-items: center;
                justify-content:center;
                position: absolute;
                width: 100%;
                bottom: 40px;
                top: 0;
            }
            .web-player .control-main .icon-play{
                width: 50px;
                height: 50px;
            }
            .web-player .hide{
                display: none;
            }
            .web-player .control-bottom{
                position: absolute;
                bottom:0;
                left:0;
                right:0;
                display: flex;
                align-items:center;
                font-size: 12px;
                color:#fff;
                padding: 0 10px 0 10px;
            }
            .web-player .control-bottom .progress{
                display: flex;
                align-items: center;
                cursor: pointer;
                flex:1;
                height:40px;
                margin-left: 10px;
                margin-right: 10px;
            }
            .web-player .control-bottom .progress-main{
                width: 100%;
                height: 5px;
                background: #e9ecef3d;
                border-radius: 10px;
            }
            .web-player .control-bottom .progress-timeline{
                position: relative;
                width: 0%;
                height: 100%;
                background-color:#fff;
                border-radius: 10px;
            }
            .web-player .control-bottom .progress-timeline::after{
                display: none;
                content: '';
                position: absolute;
                right:-3px;
                top:-3px;
                width:10px;
                height:10px;
                border-radius: 50%;
                background-color: #fff;
            }
            .web-player .control-bottom .progress:hover .progress-timeline::after{
                display: block;
            }
            .web-player .control-bottom .progress-timeline.show-after::after{
                display: block;
            }
        </style>
        `
    } 
    _getTemplate(){
        return `
        <!-- player begin -->
        <div id="web-player" class="web-player" tabindex='-1'>
            <video id="video" class="video" playsinline="true"></video>
            <div id="control-main" class="control-main">
                <i class="icon-play">
                    <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" viewBox="0 0 16 16">
                    <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
                    </svg>
                </i>
            </div>
            <div class="control-bottom" id="control-bottom">
                <div id="time-cur">00:00:00</div>
                <div class="progress" id="progress">
                    <div class="progress-main">
                        <div id="timeline" class="progress-timeline"></div>
                    </div>
                </div>
                <div id="time-total">00:00:00</div>
            </div>
        </div>
        <!-- player end -->
        `
    }
    constructor(){
        super()
        // 是否拖拽
        this._drag = false
        // 是否聚焦
        this._focus = false
    }
    // 元素渲染成功
    connectedCallback(){
        this.attachShadow({mode: 'open'})
        this._setHtml()
        this._setOptions()
        this._event()
    }
    // 属性数组，这些属性的变化会被监视 
    static get observedAttributes() {
        return ['src','poster'] 
    }
    // 当上面数组中的属性发生变化的时候，这个方法会被调用
    attributeChangedCallback(name, oldValue, newValue) {
        if(this.shadowRoot){
            this._setOptions()
        }
    }
    _setHtml(){
        this.shadowRoot.innerHTML = this._getStyle() + this._getTemplate()
    }
    _setOptions(){
        let el = this.shadowRoot
        if(this.getAttribute('src')){
            el.querySelector('#video').src = this.getAttribute('src')
        }
        if(this.getAttribute('poster')){
            el.querySelector('#video').poster = this.getAttribute('poster')
        }
        el.querySelector('#timeline').style.width = 0
        el.querySelector('#time-total').innerHTML = this._timeFormat(0)
        el.querySelector('#time-cur').innerHTML = this._timeFormat(0)
        el.querySelector('#video').pause()
        el.querySelector('.icon-play').classList.remove('hide')
    }
    _event(){
        let el = this.shadowRoot
        // 单击事件
        el.querySelector('#control-main').addEventListener('click',(e)=>{
            if(el.querySelector('#video').paused){
                this.play()
            }else{
                this.pause()
            }
        })
        // 双击事件
        el.querySelector('#control-main').addEventListener('dblclick',(e)=>{
            if(document.fullscreenElement) {
                // 退出
                document.exitFullscreen()
            }else{
                // 进入
                el.querySelector('#web-player').requestFullscreen()
            }
        })
        // 视频加载完成
		el.querySelector('#video').addEventListener('loadedmetadata',(e)=>{
            el.querySelector('#time-total').innerHTML = this._timeFormat(el.querySelector('#video').duration)
		})
        // 视频加载出错
        el.querySelector('#video').addEventListener('error',(e)=>{
            console.log('load error')
        })
        // 视频进度更新
        el.querySelector('#video').addEventListener('timeupdate',(e)=>{
            el.querySelector('#time-cur').innerHTML = this._timeFormat(el.querySelector('#video').currentTime)
            let width = el.querySelector('#video').currentTime/el.querySelector('#video').duration * 100 + '%'
            el.querySelector('#timeline').style.width = width
		})
        // 视频结束后暂停
		el.querySelector('#video').addEventListener('ended',(e)=>{
			el.querySelector('#video').pause()
            el.querySelector('.icon-play').classList.remove('hide')
		})
        // mousedown
        el.querySelector('#progress').addEventListener('mousedown',(e)=>{
            this._drag = true
            el.querySelector('#timeline').classList.add('show-after')
            let cur = this._getRatio(e.pageX)
            el.querySelector('#video').currentTime = el.querySelector('#video').duration * cur
        })
        // mousemove
        el.querySelector('#web-player').addEventListener('mousemove',(e)=>{
            if(this._drag){
                let cur = this._getRatio(e.pageX)
                el.querySelector('#timeline').style.width = cur * 100 + '%'
                let curtime = el.querySelector('#video').duration * cur
                el.querySelector('#time-cur').innerHTML = this._timeFormat(curtime)
                // 更新视频进度
                el.querySelector('#video').currentTime = curtime
            }
        })
        // mouseup
        document.addEventListener('mouseup',(e)=>{
            this._drag = false
            el.querySelector('#timeline').classList.remove('show-after')
        })
        // touchstart
        el.querySelector('#progress').addEventListener('touchstart',(e)=>{
            // 阻止默认行为
            e.preventDefault()
            this._drag = true
            el.querySelector('#timeline').classList.add('show-after')
            let cur = this._getRatio(e.touches[0].pageX)
            el.querySelector('#video').currentTime = el.querySelector('#video').duration * cur
        })
        // touchmove
        el.querySelector('#web-player').addEventListener('touchmove',(e)=>{
            if(this._drag){
                // 阻止默认行为
                e.preventDefault()
                let cur = this._getRatio(e.touches[0].pageX)
                el.querySelector('#timeline').style.width = cur * 100 + '%'
                let curtime = el.querySelector('#video').duration * cur
                el.querySelector('#time-cur').innerHTML = this._timeFormat(curtime)
                // 更新视频进度
                el.querySelector('#video').currentTime = curtime
            }
        })
        // touchend
        document.addEventListener('touchend',(e)=>{
            this._drag = false
            el.querySelector('#timeline').classList.remove('show-after')
        })
        // 键盘事件
        document.addEventListener('keydown',(e)=>{
            if(this._focus){
                e.preventDefault()
                if(e.key == 'ArrowLeft'){
                    el.querySelector('#video').currentTime -= 10;
                    if(el.querySelector('#video').currentTime < 0){
                        el.querySelector('#video').currentTime = 0
                    }
                    el.querySelector('#time-cur').innerHTML = this._timeFormat(el.querySelector('#video').currentTime)
                    let width = (el.querySelector('#video').currentTime/el.querySelector('#video').duration*100) + '%'
                    el.querySelector('#timeline').style.width = width
                    return
                }
                if(e.key == 'ArrowRight'){
                    el.querySelector('#video').currentTime += 10;
                    if(el.querySelector('#video').currentTime > el.querySelector('#video').duration){
                        el.querySelector('#video').currentTime = el.querySelector('#video').duration
                    }
                    el.querySelector('#time-cur').innerHTML = this._timeFormat(el.querySelector('#video').currentTime)
                    let width = (el.querySelector('#video').currentTime/el.querySelector('#video').duration*100) + '%'
                    el.querySelector('#timeline').style.width = width
                    return
                }
                if(e.key == ' '){
                    if(el.querySelector('#video').paused){
                        this.play()
                    }else{
                        this.pause()
                    }
                    return
                }
            }
        })
        // 聚焦事件
        el.querySelector('#web-player').addEventListener('focus',(e)=>{
            this._focus = true
        })
        // 失去聚焦事件
        el.querySelector('#web-player').addEventListener('blur',(e)=>{
            this._focus = false
        })   
    }
    // 控制播放
    play(){
        let el = this.shadowRoot
        el.querySelector('.icon-play').classList.add('hide')
        el.querySelector('#video').play()
    }
    // 控制暂停
    pause(){
        let el = this.shadowRoot
        el.querySelector('.icon-play').classList.remove('hide')
        el.querySelector('#video').pause()
    }
    // 根据鼠标或手指移动位置，计算进度条的比例
    _getRatio(x){
        let el = this.shadowRoot
        let cur = (x-el.querySelector('#progress').getBoundingClientRect().left - document.documentElement.scrollLeft)/el.querySelector('#progress').offsetWidth
        if(cur>1){
            cur=1
        }
        if(cur<0){
            cur = 0
        }
        return cur
    }
    // 时间转换
    _timeFormat(t){
        let time = parseInt(t,10)
        let hours   = Math.floor(time / 3600)
        let minutes = Math.floor((time - (hours * 3600)) / 60)
        let seconds = time - (hours * 3600) - (minutes * 60)
        if (hours < 10) {
            hours = "0" + hours
        }
        if (minutes < 10) {
            minutes = "0" + minutes
        }
        if (seconds < 10) {
            seconds = "0" + seconds
        }
		return hours + ':' + minutes + ':' + seconds
	}

}
customElements.define('web-player', WebPlayer)
export {WebPlayer}