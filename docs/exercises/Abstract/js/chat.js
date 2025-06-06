const ChatManager = (function(){
    // 기본 채팅 기능
    const presentation = document.getElementById("messages")
    const template = {
        bot_container: document.getElementById("bot-message-container"),
        get bot_message(){ return this.bot_container.querySelector("div.bot-message"); },

        user_container: document.getElementById("user-message-container"),
        get user_message(){ return this.bot_container.querySelector("div.user_message") }
    }

    const views = { // current
        bot: null,
        user: null,

        updateBotContainer(firstMsg){
            const instance = template.bot_container.content.cloneNode(true) // true: 깊은 복사
            this.bot = instance.querySelector("div.bot-messages")
            this.bot.querySelector("div.bot-message").innerText = String(firstMsg)
            presentation.appendChild(instance)
        },
        addBotMessage(msg){
            if(this.bot !== null){
                const e = this.bot.querySelector("div.bot-message").cloneNode(true)
                e.innerText = msg
                this.bot.appendChild(e)
            }
        },

        updateUserContainer(firstMsg){
            const instance = template.user_container.content.cloneNode(true)
            this.user = instance.querySelector("div.user-messages")
            this.user.querySelector("div.user-message").innerText = String(firstMsg)
            presentation.appendChild(instance)
        },
        addUserMessage(msg){
            if(this.user !== null){
                const e = this.user.querySelector("div.user-message").cloneNode(true)
                e.innerText = msg
                this.user.appendChild(e)
            }
        }
    }


    // AI-GEMINI API
    const MODEL = "gemini-2.0-flash"
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=`
    const MAX_TOKENS = 200
    const TEMPERATURE = 0.7 // 창의성(0~1)
    let API_KEY = null

    // 채팅 입력 기능
    // 봇 
    async function requestAI(log){
        if(API_KEY === null)
            API_KEY = prompt("사용할 Gemini API KEY: ")
        try {
            const contents = Array.isArray(log)? log: [{
                parts: [{ text: String(log) }]
            }]
            const req = {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: { // generationConfig 객체 안에 설정
                        maxOutputTokens: MAX_TOKENS, // 이름 변경
                        temperature: TEMPERATURE
                    }
                })
            }
            // console.log(req)
            const res = await fetch(API_ENDPOINT + API_KEY, req)
            console.log(res.status)
            if(res.ok){
                const data = await res.json()
                console.log(data)
                return data.candidates?.[0]?.content?.parts?.[0]?.text
            }
            else {
                if(res.status === 400){
                    alert("유효하지 않은 API KEY입니다!")
                } else if(res.status === 403 || res.status === 401){
                    alert("API 키 인증 실패 또는 권한 부족!")
                } else if(res.status = 429){
                    alert("API 사용량 한도 초과!")
                } else {
                    alert("알 수 없는 응답 오류 발생!")
                }
                API_KEY = null
            }
            return null
        } catch(e){
            console.error('API 요청에서 뭔가 치명적인 오류가 터졌는데 뭔지 모르겠습니다')
            return null
        }
    }

    const input_area = document.getElementById("question")
    input_area.addEventListener("keydown", e => {
        if(e.key === "Enter"){
            if(e.shiftKey) return;
            e.preventDefault() // 이벤트를 발생시킨 기존 입력의 추가 처리 무시
            const userPrompt = input_area.value
            views.updateUserContainer(userPrompt)
            input_area.value = ""

            requestAI(userPrompt).then(res => views.updateBotContainer(res))
        }
    })


    // 채팅창 여닫기
    const CHAT_SHOW_CLASSNAME = "chat-container-show"
    // 열기
    let state = 0 // 닫힘
    const open_button = document.querySelector("button.widget-help")
    const chat_container = document.querySelector("div.chat-container")
    open_button.addEventListener("click", e => {
        if(state == 0){
            state = 1
            // 버튼 치우기
            open_button.style = `
                bottom: -3rem;
                opacity: 0;
            `
            // 채팅창 띄우기
            if(!chat_container.classList.contains(CHAT_SHOW_CLASSNAME))
                chat_container.classList.add(CHAT_SHOW_CLASSNAME)
        } else {
            alert("어떻게 클릭했대?")
        }
    })
    // 닫기
    const close_button = document.getElementById("close-chat")
    close_button.addEventListener("click", e => {
        if(state == 1){
            state = 0
            // 채팅창 치우고 로그 비우기
            if(chat_container.classList.contains(CHAT_SHOW_CLASSNAME))
                chat_container.classList.remove(CHAT_SHOW_CLASSNAME)
            clearChat()
            // 버튼 띄우기
            open_button.style = ''
        } else {
            alert("아니 어떻게 클릭하셨어요??")
        }
    })



    function clearChat(){
        Array.from(presentation.children).forEach(child => {
                if(child.tagName !== "TEMPLATE")
                    presentation.removeChild(child)
        })
    }

    return {
        template: template,
        views: views,
        clearChat,
        requestAI,
        get key(){ return API_KEY }
    }
})()