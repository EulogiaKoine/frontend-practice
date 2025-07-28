import Swipeable from "./Swipeable.js"

const PAGE_VIEWPORT_WIDTH = 1200 // px
const PAGE_SCALE = 1/4
const PAGE_ASPECT_RATIO = 9/12 // width/height


async function loadJSONFile(path){
    try {
        const res = await fetch(path)
        if(!res.ok)
            throw new Error(`HTTP error! status: ${res.status}`)
        return await res.json()
    } catch(e) {
        console.error(e)
        return null
    }
}
// test -> success
// loadJSONFile('data/pages-template.json').then(res => {
//     console.log(res)
// })


// 타 페이지 제작. 단순하게 쓸거라 그냥 함수 하나로 퉁치기.
/**
 * 타 페이지의 보이는 모습을 썸네일 요소로 만드는 함수
 * @param {number} width iframe viewport 가로크기
 * @param {number} height 요소 세로크기
 * @param {number} scale 메인페이지에서 조절할 스케일
 * @returns {HTMLIFrameElement}
 */
function createScaledIframeThumbnail(src, proxySrc, width=PAGE_VIEWPORT_WIDTH,
        height=PAGE_VIEWPORT_WIDTH*PAGE_SCALE/PAGE_ASPECT_RATIO, scale=PAGE_SCALE, asAnchor=true){
    const iframe = document.createElement('iframe')
    iframe.src = src
    iframe.width = width * scale
    iframe.height = height
    iframe.style.backgroundColor = 'rgb(255,255,255)'
    iframe.style.setProperty('pointer-events', 'none', 'important')
    iframe.style.border = "none"

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
        a.href = proxySrc ?? src
        a.target = "_blank"

        a.style.display = "block"
        a.style.backgroundColor = "white"
        a.appendChild(iframe)
        return a
    }

    return iframe
}


const pageContainer = document.getElementById('swiper-test')
const pageSamples = [
    'exercises/Abstract/index.html',
    'exercises/Ableton/index.html',
    ['page-wrapper/lobe.html', 'https://suuuunng.github.io/front-practice/']
]
for(let src of pageSamples){
    let iframe
    if(Array.isArray(src))
        iframe = createScaledIframeThumbnail(src[0], src[1])
    else
        iframe = createScaledIframeThumbnail(src)
    iframe.setAttribute('data-is-page', '')

    // url로 이어지는 앵커 추가
    

    pageContainer.appendChild(iframe)
}

const swiper = new Swipeable(pageContainer)
swiper.setAnimation(true)




