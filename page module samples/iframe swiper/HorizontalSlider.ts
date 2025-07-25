/**
 * @module HorizontalSlider
 * @description
 *   요소에 마우스/터치를 이용한 가로축 스와이프/스크롤링과, 키보드를 이용한 스텝(정수) 단위 Snap이 가능하도록 함.
 *   애니메이션과 Scroll Snap은 이하 horizontal-slider CSS 클래스에서 구현
 *   HorizontalSlider JS class의 책임은 마우스/터치/키보드 이벤트에 따른 이동 처리.
 */

type SliderEventType = 'scrollStart' | 'change' | 'scrollEnd'
type SlideOptions = {
        totalSteps: number
        initialStep: number
    }

function clamp(x: number, a: number, b: number):number {
    if(x < a) return a
    if(b < x) return b
    return x
}

class HorizontalSlider {
    private element: HTMLElement // 전체 슬라이더 컨테이너
    private options: SlideOptions
    private currentStep: number
    private isScrolling: boolean = false
    private scrollTimeout: number | null = null // scrollend 감지를 위한 타이머
    private eventListeners: { [key in SliderEventType]?: Function[] } = {}

    // constants
    public static DEFAULT_INITIAL_STEP: number = 0 // 기본 시작 스텝
    public static CSS_SLIDER_CLASSNAME: string = 'horizontal-slider-container' // 애니메이션/Snap 등을 부여해주는 컨테이너 클래스
    public static CSS_SLIDER_ITEM_CLASSNAME: string = 'horizontal-slider-item' // 슬라이드될 자식 요소

    /**
     * @param element 슬라이드 기능을 적용할 DOM 요소
     * @param options.totalSteps 전체 슬라이드 스텝 수 (최소 1)
     * @param options.initialStep 시작 스텝 (기본값 0)
     */
    constructor(element: HTMLElement, options: SlideOptions) {
        if (!element)
            throw new Error('슬라이더로 사용할 컨테이너 요소 필수')
        if (options.totalSteps < 1)
            throw new Error('총 스텝은 1 이상으로')

        this.element = element
        this.options = {
            totalSteps: options.totalSteps,
            initialStep: clamp(
                options.initialStep,
                0, options.totalSteps-1
            )
        }

        // 초기 스텝 설정 (범위 보정)
        this.currentStep = this.options.initialStep
        this.initialize()
    }

    private initialize(): void {
        // 필수 CSS 속성/클래스 적용
        this.element.classList.add('horizontal-slider-container')
        this.element.style.position = this.element.style.position || 'relative'
        // 아이템에도
        Array.from(this.element.children).forEach(
            (child: Element) => (child as HTMLElement).classList.add('horizontal-slider-item')
        )

        this.addEventListeners()
        this.slideToStep(this.currentStep, false) // 초기 위치 설정 (애니메이션 없이)
    }

    private addEventListeners(): void {
        this.element.addEventListener('scroll', this.handleScroll)
        // 드래그 시작/종료 감지 핸들러
        // this.element.addEventListener('mousedown', this.handleMouseDown)
        // this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true }) // passive: true로 스크롤 성능 최적화

        // 키보드 이벤트
        this.element.setAttribute('tabindex', '0')
        this.element.addEventListener('keydown', this.handleKeyDown)
    }
    private removeEventListeners(): void {
        this.element.removeEventListener('scroll', this.handleScroll)
        // this.element.removeEventListener('mousedown', this.handleMouseDown)
        // this.element.removeEventListener('touchstart', this.handleTouchStart)
        // document.removeEventListener('mouseup', this.handleMouseUp)
        // document.removeEventListener('touchend', this.handleTouchEnd)
        this.element.removeEventListener('keydown', this.handleKeyDown)
        if (this.scrollTimeout)
            clearTimeout(this.scrollTimeout)
    }

    // --- 이벤트 핸들러 ---
    private handleScroll = (): void => {
        // start 이벤트 트리거
        if (!this.isScrolling) {
            this.isScrolling = true
            this.triggerEvent('scrollStart', this.currentStep, this.getPercentage())
        }

        // 현재 스크롤 위치 기반으로 스텝 업데이트
        const newStep = this.calculateCurrentStep()
        if (newStep !== this.currentStep) {
            this.currentStep = newStep
            this.triggerEvent('change', this.currentStep, this.getPercentage())
        }

        // scrollend 감지 (스크롤이 멈췄을 때)
        // if (this.scrollTimeout)
        //     clearTimeout(this.scrollTimeout)

        // this.scrollTimeout = setTimeout(() => {
        //     this.isScrolling = false
        //     // 스크롤이 완전히 멈춘 후 최종 스텝 확정 및 slideEnd 이벤트 트리거
        //     const finalStep = this.calculateCurrentStep()
        //     if (finalStep !== this.currentStep) {
        //          this.currentStep = finalStep
        //          this.triggerEvent('change', this.currentStep, this.getPercentage())
        //     }
        //     this.triggerEvent('scrollEnd', this.currentStep, this.getPercentage())
        // }, 100) // 스크롤이 100ms 동안 없으면 멈췄다고 간주
    }

    private calculateCurrentStep(): number {
        const scrollLeft = this.element.scrollLeft // 좌측으로부터 스크롤된 px값 = currentX
        const sliderWidth = this.element.clientWidth
        if (sliderWidth === 0) return this.currentStep // 너비가 0이면 계산상 문제가 발생할 수 있어 그냥 유지

        const stepWidth = sliderWidth // 각 스텝의 너비 = 컨테이너 너비로
        return clamp(
            Math.round(scrollLeft / stepWidth),
            0, this.options.totalSteps-1
        )
    }

    // 드래그 시작/종료 감지 (CSS 스냅과 별개로 UI/UX를 위해 유지)
    // private handleMouseDown = (e: MouseEvent): void => {
    //     if (e.button === 0) {
    //         this.element.style.cursor = 'grabbing';
    //         document.addEventListener('mouseup', this.handleMouseUp);
    //     }
    // };

    // private handleMouseUp = (): void => {
    //     this.element.style.cursor = 'grab';
    //     document.removeEventListener('mouseup', this.handleMouseUp);
    // };

    // private handleTouchStart = (e: TouchEvent): void => {
    //     if (e.touches.length === 1) {
    //         this.element.style.cursor = 'grabbing'; // 시각적 효과만
    //         document.addEventListener('touchend', this.handleTouchEnd);
    //     }
    // };

    // private handleTouchEnd = (): void => {
    //     this.element.style.cursor = 'grab';
    //     document.removeEventListener('touchend', this.handleTouchEnd);
    // };

    private handleKeyDown = (e: KeyboardEvent): void => {
        let newStep = this.currentStep;
        if (e.key === 'ArrowLeft') {
            newStep = Math.max(0, this.currentStep - 1)
            e.preventDefault() // 스크롤 방지
        } else if (e.key === 'ArrowRight') {
            newStep = Math.min(this.options.totalSteps - 1, this.currentStep + 1)
            e.preventDefault() // 스크롤 방지
        }

        if (newStep !== this.currentStep)
            this.slideToStep(newStep)
    };


    // --- 공개 메서드 ---

    /**
     * 특정 스텝으로 슬라이드합니다.
     * @param step 이동할 스텝 인덱스
     * @param animate 애니메이션 적용 여부 (기본값 true)
     */
    public slideToStep(step: number, animate: boolean = true): void {
        const newStep = clamp(Math.round(step), 0, this.options.totalSteps-1)

        if (newStep !== this.currentStep || !animate) {
            this.currentStep = newStep;
            const scrollTarget = this.currentStep * this.element.clientWidth;

            if (animate) {
                // CSS scroll-behavior: smooth에 의해 애니메이션 처리됨
                this.element.scrollLeft = scrollTarget;
            } else {
                // 애니메이션 없이 즉시 이동
                this.element.style.scrollBehavior = 'auto'; // 일시적으로 애니메이션 끔
                this.element.scrollLeft = scrollTarget;
                // 다음 틱에 다시 smooth로 복구 (애니메이션이 완료된 후)
                requestAnimationFrame(() => {
                    this.element.style.scrollBehavior = 'smooth';
                });
            }

            // `handleScroll`에서 `change` 이벤트 트리거를 담당합니다.
            // 여기서는 slideToStep 호출로 인한 명시적인 변경이므로 직접 트리거할 수도 있습니다.
            // 하지만 중복 방지를 위해 handleScroll에 위임하는 것이 좋습니다.
        }
    }

    // 좌우 한 칸씩 이동
    public next(): void {
        this.slideToStep(this.currentStep + 1)
    }
    public prev(): void {
        this.slideToStep(this.currentStep - 1);
    }
    // 현재 스텝 인터페이스 
    public getCurrentStep(): number {
        return this.currentStep
    }
    // 현재 슬라이더 위치의 백분율
    public getPercentage(): number {
        if (this.options.totalSteps <= 1) return 0;
        return (this.currentStep / (this.options.totalSteps - 1)) * 100;
    }

    /**
     * 슬라이더 이벤트 구독(리스너 등록)
     * @param {SliderEventType} eventName 구독할 이벤트명 ('change', 'slideStart', 'slideEnd')
     * @param callback 이벤트 발생 시 호출될 콜백 함수 (currentStep: number, percentage: number)
     */
    public on(eventName: SliderEventType, callback: (currentStep: number, percentage: number) => void): void {
        if (!this.eventListeners[eventName])
            this.eventListeners[eventName] = []
        this.eventListeners[eventName]?.push(callback)
    }

    /**
     * 슬라이더 이벤트를 구독 해지합니다.
     * @param eventName 구독 해지할 이벤트 이름
     * @param callback 이전에 구독했던 콜백 함수
     */
    public off(eventName: SliderEventType, callback: (currentStep: number, percentage: number) => void): void {
        if (this.eventListeners[eventName])
            this.eventListeners[eventName] = this.eventListeners[eventName]
                                                ?.filter(fn => fn !== callback)
    }

    private triggerEvent(eventName: SliderEventType, currentStep: number, percentage: number): void {
        this.eventListeners[eventName]
            ?.forEach(callback => callback(currentStep, percentage))
    }

    // 슬라이더 비활성화(영구)
    public destroy(): void {
        this.removeEventListeners()
        this.element.classList.remove(HorizontalSlider.CSS_SLIDER_CLASSNAME)
        this.element.style.position = ''
        // this.element.style.cursor = ''
        this.element.removeAttribute('tabindex')

        // 슬라이더 아이템에 추가했던 클래스 제거
        Array.from(this.element.children).forEach(
            (child: Element) => (child as HTMLElement).classList.remove(HorizontalSlider.CSS_SLIDER_ITEM_CLASSNAME)
        )
    }
}