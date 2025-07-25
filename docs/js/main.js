import Swipeable from "./Swipeable.js"


// 타 페이지 제작. 단순하게 쓸거라 그냥 함수 하나로 퉁치기.
/**
 * 타 페이지의 보이는 모습을 썸네일 요소로 만드는 함수
 * @param {number} width iframe viewport 가로크기
 * @param {number} height 요소 세로크기
 * @param {number} scale 메인페이지에서 조절할 스케일
 * @returns {HTMLIFrameElement}
 */
function createScaledIframeThumbnail(src, width, height, scale, asAnchor){
    const iframe = document.createElement('iframe')
    iframe.src = src
    iframe.width = width * scale
    iframe.height = height
    iframe.style.backgroundColor = 'rgb(255,255,255)'
    iframe.style.setProperty('pointer-events', 'none', 'important')

    iframe.onload = () => {
        try{ 
            const body = iframe.contentDocument.body || iframe.contentWindow.document.body
            body.style.width = `${width}px`
            body.style.transformOrigin = '0 0'
            body.style.transform = `scale(${scale})`

            // 스크롤 삭제
            body.style.overflow = 'hidden'
            // 상호작용 차단
            body.style.setProperty('pointer-events', 'none', 'important')
        } catch(e){
            console.log(e)
        }
    }

    if(asAnchor){
        const a = document.createElement('a')
        a.href = src
        a.target = "_blank"
        a.appendChild(iframe)
        return a
    }

    return iframe
}


const pageContainer = document.getElementById('swiper-test')
const pageSamples = ['exercises/Abstract/index.html', 'exercises/Ableton/index.html']
for(let src of pageSamples){
    let iframe = createScaledIframeThumbnail(src, 1200, 400, 1/3, true)
    iframe.setAttribute('data-is-page', '')

    // url로 이어지는 앵커 추가
    

    pageContainer.appendChild(iframe)
}

const swiper = new Swipeable(pageContainer)
swiper.setAnimation(true)

window.createScaledIframeThumbnail = createScaledIframeThumbnail