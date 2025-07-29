import Swipeable from "./Swipeable.js"

const PAGE_VIEWPORT_WIDTH = 1200 // px
const PAGE_SCALE = 1/4
const PAGE_ASPECT_RATIO = 9/12 // width/height
const THUMBNAIL_STYLE_CLASS = 'page-thumbnail'
const PAGE_SCROLLWIDTH = '15px'


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
function createScaledIframeThumbnail(src, scale=PAGE_SCALE,
    width=PAGE_VIEWPORT_WIDTH, height=width/PAGE_ASPECT_RATIO,
    asAnchor=true)
{
    // 띄울 페이지 프레임(스케일 조절 및 컨테이너용)
    const scaled_wrapper = document.createElement('div')
    // 크기+스케일 조절
    scaled_wrapper.style.width = `${width}px`
    scaled_wrapper.style.height = `${height}px`
    scaled_wrapper.style.transform = `scale(${scale})`
    scaled_wrapper.style.overflow = 'hidden' // 스크롤바 가리게
    scaled_wrapper.style.transformOrigin = '0 0'
    
    // 페이지 띄울 iframe
    const iframe = document.createElement('iframe')
    iframe.src = src
    iframe.style.width = `calc(100% + ${PAGE_SCROLLWIDTH})`
    iframe.style.height = '100%'
    iframe.style.backgroundColor = 'rgb(255,255,255)'
    // 상호작용 차단(썸네일용이므로)
    iframe.style.pointerEvents = 'none'
    // 깔끔하게 외곽선은 없애기
    iframe.style.border = 'none'
    scaled_wrapper.appendChild(iframe)

    // 외부 컨트롤용 컨테이너로 한 번 더 감싸기
    let thumbnail_container
    if(asAnchor){ // 컨테이너를 앵커로
        thumbnail_container = document.createElement('a')
        thumbnail_container.href = src
        thumbnail_container.target = '_blank'
    } else {
        thumbnail_container = document.createElement('div')
    }
    thumbnail_container.style.display = 'flex'
    thumbnail_container.style.justifyContent = 'center'
    thumbnail_container.style.alignItems = 'center'
    thumbnail_container.style.width = `${width * scale}px`
    thumbnail_container.style.height = `${height * scale}px`
    thumbnail_container.style.overflow = 'hidden'
    thumbnail_container.appendChild(scaled_wrapper)

    // 스타일용 클래스 추가
    thumbnail_container.classList.add(THUMBNAIL_STYLE_CLASS)
    
    return thumbnail_container
}


const pageContainer = document.getElementById('swiper-test')
const pageSamples = [
    'exercises/Abstract/index.html',
    'exercises/Ableton/index.html',
    'https://suuuunng.github.io/front-practice/'
]
for(let src of pageSamples){
    let iframe
    if(0 && Array.isArray(src))
        iframe = createScaledIframeThumbnail(src[0] /*, src[1] */)
    else
        iframe = createScaledIframeThumbnail(src)
    iframe.setAttribute('data-is-page', '')

    pageContainer.appendChild(iframe)
}

const swiper = new Swipeable(pageContainer)
swiper.setAnimation(true)




