/**
 * @fileoverview 페이지 단위로 스와이프되는 캐러셀을 구현하는 클래스입니다. 애니메이션 기능을 포함합니다.
 *
 * 이 모듈은 특정 DOM 구조를 가정합니다. 캐러셀 컨테이너 내의 각 슬라이드 요소는
 * 반드시 `data-is-page` 속성을 가지고 있어야 합니다.
 *
 * 커스터마이징을 위한 주요 필드 및 인터페이스:
 * - `gap`: 페이지 사이의 간격을 설정합니다. (px 단위, 숫자, 0 이상)
 * - `setAnimation(boolean)`: 스와이프 애니메이션의 활성화 여부를 설정합니다.
 * - `swipePage(delta)`: 현재 페이지를 기준으로 `delta`만큼 페이지를 스와이프합니다.
 * - `setHighlighted(index)`: 특정 인덱스의 페이지를 강조 표시하고 해당 페이지로 스와이프합니다.
 */

function clamp(x, a, b){
    if(x < a) return a
    if(b < x) return b
    return x
}

export default class Swipeable {
    cont = null
    containerWidth = 0
    highlighted = 0
    originX = 0
    startX = 0
    pages = []
    $gap = 0 // px. 초기값을 0으로 설정하여 기본 간격 없음
    get gap(){ return this.$gap }
    set gap(v){
        if(typeof v === 'number' && v >= 0)
            this.$gap = v
        else
            throw new TypeError("gap must be a number [>=0]")
        
        this.updateTotalLoopWidth()
        this.initPagePositions()
        this.snap()
    }

    resizer = null
    animation = false
    setAnimation(go){ this.animation = !!go }
    targetDX = 0
    aniReq = null
    animationStartTime = 0
    animationDuration = 300

    currentOffset = 0
    pageWidths = []
    totalLoopWidth = 0
    _basePageX = []
    _animationStartOffset = 0

    constructor(element){
        if(element instanceof HTMLElement)
            this.init(element)
        else
            console.error("요소 입력 필수")
        
        // gap의 초기값 설정 및 관련 초기화 로직 호출
        // setter를 통해 gap을 설정하면 관련 계산이 자동으로 수행됨
        this.gap = 0 
    }

    init(cont){
        this.cont = cont
        cont.style.position = 'relative'
        cont.style.overflow = 'hidden'

        this.originX = (this.containerWidth = parseFloat(window.getComputedStyle(cont).width)) / 2

        Array.from(cont.children).filter(e => e.hasAttribute('data-is-page'))
            .forEach(e => {
                this.initPage(e)
                this.pages.push(e)
                this.pageWidths.push(e.offsetWidth)
            })
        
        this.updateTotalLoopWidth()
        this.initPagePositions()
        this.initSizeObserver()

        this.cont.addEventListener('mousedown', this.handleMouseDown)
    }

    updateTotalLoopWidth(){
        if(this.pages.length < 2) {
            this.totalLoopWidth = 0
        } else {
            this.totalLoopWidth = this.pages.reduce((sum, page, i) => {
                return sum + this.pageWidths[i] + this.$gap
            }, 0)
        }
    }

    initSizeObserver(){
        if(this.resizer !== null)
            this.resizer.disconnect()

        this.resizer = new ResizeObserver(entry => {
            entry = entry[0]
            this.containerWidth = entry.contentRect.width
            this.originX = this.containerWidth / 2

            this.pageWidths = this.pages.map(e => e.offsetWidth)
            this.updateTotalLoopWidth()

            this.initPagePositions()
            this.snap()
        })

        this.resizer.observe(this.cont)
    }

    initPage(e){
        if(!e.style.display.includes('block'))
            e.style.display = 'block'
        
        e.style.position = 'absolute'
        e.style.top = '50%'
        e.style.transform = "translate(-50%, -50%) translateX(0px)"
    }

    initPagePositions(){
        this._basePageX = []
        let currentX = 0

        for (let i = 0; i < this.pages.length; i++) {
            this._basePageX[i] = currentX + this.pageWidths[i] / 2
            currentX += this.pageWidths[i] + this.$gap
        }

        this.pages.forEach((page, i) => {
            this._applyPageTransform(i, this._basePageX[i], this.currentOffset)
        })
    }

    getPagePosition(i){
        if(i < 0 || this.pages.length <= i)
            throw new Error("페이지 인덱스 이탈")
        const match = this.pages[i].style.transform.match(/translateX\(([-]?[\d.]+)px\)/)
        return match? parseFloat(match[1]): 0
    }

    calculateDistanceFromOrigin(i){
        if(i < 0 || this.pages.length <= i)
            throw new Error("페이지 인덱스 이탈")
        return Math.abs(this.originX - this.getPagePosition(i))
    }

    _applyPageTransform(i, basePageX, currentOffset){
        if(i < 0 || this.pages.length <= i)
            throw new Error("페이지 인덱스 이탈")
        const page = this.pages[i]
        const pageHalfWidth = this.pageWidths[i] / 2

        let visualX = (basePageX - this.totalLoopWidth / 2) + currentOffset 

        if (this.pages.length >= 2 && this.totalLoopWidth > 0) {
            while (visualX < this.originX - this.totalLoopWidth / 2 - pageHalfWidth) {
                visualX += this.totalLoopWidth
            }
            while (visualX > this.originX + this.totalLoopWidth / 2 + pageHalfWidth) {
                visualX -= this.totalLoopWidth
            }
        }

        let transformStr = page.style.transform
        if(transformStr.includes('translateX'))
            transformStr = transformStr.replace(/translateX\(.+\)/, `translateX(${visualX}px)`)
        else
            transformStr += ` translateX(${visualX}px)`
        page.style.transform = transformStr

        this.styleByDistanceFromOrigin(page, Math.abs(this.originX - visualX))
    }

    styleByDistanceFromOrigin(page, distance){
        const near = (this.originX*1.5 - distance)/this.originX/1.5
        
        let transformStr = page.style.transform

        if(transformStr.includes('scale'))
            transformStr = transformStr.replace(/scale\(.+\)/, `scale(${clamp(near, 0, 1)})`)
        else
            transformStr += ` scale(${clamp(near, 0, 1)})`
        page.style.transform = transformStr

        page.style.zIndex = Math.floor(clamp(near, 0, 1) * 100)
    }

    calculateHighlighted(){
        let res = 0
        let minDistance = Infinity

        this.pages.forEach((page, i) => {
            const currentVisualX = this.getPagePosition(i)
            const distance = Math.abs(this.originX - currentVisualX)

            if(distance < minDistance){
                minDistance = distance
                res = i
            }
        })
        return res
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    swipe(dx){
        if(this.animation){
            if(this.aniReq)
                cancelAnimationFrame(this.aniReq)

            this.targetDX = dx
            this.animationStartTime = performance.now()
            this._animationStartOffset = this.currentOffset

            this.aniReq = requestAnimationFrame(this.traceAnimation)
        } else {
            this.currentOffset += dx
            this.pages.forEach((page, i) => {
                this._applyPageTransform(i, this._basePageX[i], this.currentOffset)
            })
        }
    }

    setHighlighted(idx){
        if(idx < 0 || idx >= this.pages.length)
            throw new RangeError(`없는 페이지 ${idx}`)

        const targetBaseX = this._basePageX[idx]
        const newTargetOffset = this.originX - (targetBaseX - this.totalLoopWidth / 2)

        if (this.pages.length >= 2 && this.totalLoopWidth > 0) {
            let diff = newTargetOffset - this.currentOffset
            diff = ((diff % this.totalLoopWidth) + this.totalLoopWidth) % this.totalLoopWidth
            if (diff > this.totalLoopWidth / 2)
                diff -= this.totalLoopWidth
            this.swipe(diff)
        } else {
            this.swipe(newTargetOffset - this.currentOffset)
        }

        this.highlighted = idx
    }

    swipePage(di){
        if(di === 0) return

        let nextHighlighted = (this.highlighted + di) % this.pages.length
        if (nextHighlighted < 0)
            nextHighlighted += this.pages.length

        const targetBaseX = this._basePageX[nextHighlighted]
        const idealTargetOffset = this.originX - (targetBaseX - this.totalLoopWidth / 2)

        let dx = idealTargetOffset - this.currentOffset

        if (this.pages.length >= 2 && this.totalLoopWidth > 0) {
            if (dx > this.totalLoopWidth / 2) 
                dx -= this.totalLoopWidth
            else if (dx < -this.totalLoopWidth / 2)
                dx += this.totalLoopWidth
        }
        
        this.swipe(dx)
        this.highlighted = nextHighlighted
    }

    snap(){
        this.setHighlighted(this.calculateHighlighted())
    }

    handleMouseDown = e => {
        this.pages.forEach(p => p.style.pointerEvents = 'none')
        if (this.aniReq) {
            cancelAnimationFrame(this.aniReq)
            this.aniReq = null
        }
        this.startX = e.clientX
        document.body.addEventListener('mousemove', this.handleMouseMove)
        document.body.addEventListener('mouseup', this.handleMouseUp)
    }

    handleMouseMove = e => {
        const deltaX = e.clientX - this.startX
        this.currentOffset += deltaX
        this.pages.forEach((page, i) => {
            this._applyPageTransform(i, this._basePageX[i], this.currentOffset)
        })
        this.startX = e.clientX
    }

    handleMouseUp = e => {
        document.body.removeEventListener('mousemove', this.handleMouseMove)
        document.body.removeEventListener('mouseup', this.handleMouseUp)
        this.snap()
        this.pages.forEach(p => p.style.pointerEvents = '')
    }

    traceAnimation = timeStamp => {
        const elapsed = timeStamp - this.animationStartTime
        let progress = elapsed / this.animationDuration

        if (progress >= 1) {
            this.currentOffset = this._animationStartOffset + this.targetDX
            this.targetDX = 0
            cancelAnimationFrame(this.aniReq)
            this.aniReq = null

            this.pages.forEach((page, i) => {
                this._applyPageTransform(i, this._basePageX[i], this.currentOffset)
            })

            this.snap()
            return
        }

        const animatedCurrentOffset = this._animationStartOffset + this.targetDX * this.easeInOutQuad(progress)

        this.pages.forEach((page, i) => {
            this._applyPageTransform(i, this._basePageX[i], animatedCurrentOffset)
        })

        this.aniReq = requestAnimationFrame(this.traceAnimation)
    }
}