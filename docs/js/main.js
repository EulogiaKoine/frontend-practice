import Swipeable from "./Swipeable.js"

const PAGE_VIEWPORT_WIDTH = 1200 // px
const PAGE_SCALE = 1/4
const PAGE_ASPECT_RATIO = 9/12 // width/height
const PAGE_SCROLLWIDTH = 15
const PROFILE_WIDTH = 80
const PROFILE_HEIGHT = PROFILE_WIDTH

const Templates = {
    PAGE_PREVIEW: 'page-preview-swiper',
    PROFILE: 'profile-template'
}

const CSS_class = {
    THUMBNAIL_STYLE: 'page-thumbnail',
    SWIPER: 'swiper',
    SWIPER_HIDDEN: 'swiper-hidden',
    PROFILE: 'profile-icon',
    PROFILE_SELECTED: 'profile-icon-selected'
}


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
    iframe.style.width = `calc(100% + ${PAGE_SCROLLWIDTH}px)`
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
    thumbnail_container.classList.add(CSS_class.THUMBNAIL_STYLE)
    
    return thumbnail_container
}


// 현재 보여지는 페이지들
const highlighted = {
    profile: null,
    swiper: null
}


/**
 * @param {string} id 
 * @param {string[]} pages [page url, ...] 
 */
function createSwiper(id, pages){
    const template = document.getElementById(Templates.PAGE_PREVIEW)
    if(template === null){
        console.error(`no template id ${Templates.PAGE_PREVIEW}`)
        return null
    }

    const swiper = template.content.cloneNode(true).children[0]
    swiper.id = id + '-swiper'

    let childPage
    pages.forEach(url => {
        childPage = createScaledIframeThumbnail(url)
        childPage.setAttribute('data-is-page', '')
        swiper.appendChild(childPage)
    })

    const swipeHandler = new Swipeable(swiper)
    swipeHandler.setAnimation(true)

    return swiper
}

/**
 * 
 * @param {string} id 
 * @param {string} src 
 */
function createProfile(id, src){
    const template = document.getElementById(Templates.PROFILE)
    if(template === null){
        console.error(`no template id ${Templates.PROFILE}`)
        return null
    }

    const wrapper = template.content.cloneNode(true).children[0]
    const profile = wrapper.querySelector('.profile-icon') // .icon-wrapper
    profile.id = `${id}-profile`

    // button
    const button = profile.querySelector('button')
    button.addEventListener('click', () => highlight(id))

    // img
    button.children[0].src = src

    return wrapper
}

function highlight(id){
    const profile = document.getElementById(`${id}-profile`).parentElement
    const swiper = document.getElementById(`${id}-swiper`)
    if(!(profile && swiper)){
        console.error(`cannot find profile or swiper with id '${id}'`)
        return
    }

    if(highlighted.profile === profile && highlighted.swiper === swiper){
        console.info(`already highlighted such id ${id}`)
        return
    }

    // 프로필 스타일 변경
    if(highlighted.profile?.classList.contains(CSS_class.PROFILE_SELECTED))
        highlighted.profile.classList.remove(CSS_class.PROFILE_SELECTED)
    highlighted.profile = profile
    if(!profile.classList.contains(CSS_class.PROFILE_SELECTED))
        profile.classList.add(CSS_class.PROFILE_SELECTED)

    // 프리뷰 전환
    if(!highlighted.swiper?.classList.contains(CSS_class.SWIPER_HIDDEN))
        highlighted.swiper?.classList.add(CSS_class.SWIPER_HIDDEN)
    highlighted.swiper = swiper
    if(swiper.classList.contains(CSS_class.SWIPER_HIDDEN))
        swiper.classList.remove(CSS_class.SWIPER_HIDDEN)
}

const profile_container = document.getElementById('profiles')
const page_preview_container = document.getElementById('page-preview')
loadJSONFile('data/pages-template.json').then(data => {
    data.forEach(info => {
        profile_container.appendChild(createProfile(info.id, info.icon))
        page_preview_container.appendChild(createSwiper(info.id, info.pages))
    })
    highlight(data[0].id)
})

