// 1. مفتاح الـ API
// تم إفراغ المفتاح ليعمل بنجاح داخل بيئة المعاينة (Canvas) هنا.
// لتشغيله على جهازك الشخصي، ضع المفتاح "الجديد" بين علامات التنصيص:
const apiKey = ""; 

// 2. تفعيل الأيقونات والظهور
window.onload = function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.error("خطأ: مكتبة الأيقونات لم تحمل بشكل صحيح.");
    }
    reveal();
};

// 3. السكرول السلس
document.querySelectorAll('.nav-link, a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// 4. منطق المساعد الذكي (AI Chatbot)
const toggleAi = document.getElementById('toggle-ai');
const chatBox = document.getElementById('ai-chat-box');
const aiInput = document.getElementById('ai-input');
const sendBtn = document.getElementById('send-ai');
const chatContent = document.getElementById('chat-content');
const closeAi = document.getElementById('close-ai');

if (toggleAi) {
    toggleAi.onclick = (e) => {
        e.stopPropagation();
        const isHidden = chatBox.classList.contains('hidden');
        if (isHidden) {
            chatBox.classList.remove('hidden');
            chatBox.classList.add('flex');
            chatBox.style.pointerEvents = "auto";
            setTimeout(() => aiInput.focus(), 300);
        } else {
            chatBox.classList.add('hidden');
            chatBox.classList.remove('flex');
        }
    };
}

if (closeAi) {
    closeAi.onclick = () => {
        chatBox.classList.add('hidden');
        chatBox.classList.remove('flex');
    };
}

if (chatBox) {
    chatBox.onclick = (e) => e.stopPropagation();
}

// دالة الاتصال بـ Gemini (مجهزة للعمل بأحدث نماذج المعاينة)
async function callGemini(text) {
    const model = "gemini-2.5-flash-preview-09-2025";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const systemPrompt = "أنت مساعد ذكي للمبرمج 'أحمد محمد السيد'. أحمد هو مبرمج ومصمم محترف متخصص في HTML/Tailwind/JS وبناء المتاجر والحجوزات. لديه 5 سنوات خبرة في مصر والوطن العربي. رقم الواتساب: 01080023702. رد بلهجة مصرية قصيرة ومحترمة جداً وذكية.";
    
    // دمج التعليمات مع السؤال
    const payload = {
        contents: [{ parts: [{ text: `${systemPrompt}\n\nسؤال المستخدم: ${text}` }] }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error Detail:", errorData);
            throw new Error(errorData.error?.message || "Connection Error");
        }
        
        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) throw new Error("Empty Response");
        
        return resultText;
    } catch (error) {
        console.error("Detailed Fetch Error:", error);
        throw error;
    }
}

async function handleChat() {
    const text = aiInput.value.trim();
    if (!text) return;

    // إضافة رسالة المستخدم
    appendMessage(text, 'user');
    aiInput.value = "";

    // إضافة فقاعة "جاري التفكير"
    const loadingId = appendMessage('<div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>', 'ai', true);

    try {
        const aiResponse = await callGemini(text);
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerHTML = aiResponse;
        }
    } catch (error) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            let errorMsg = "عذراً، حدث خطأ في الاتصال.";
            
            if (error.message.includes('API_KEY_INVALID') || !apiKey) {
                errorMsg = "خطأ: مفتاح الـ API غير صالح أو غير موجود.";
            } else if (error.message.includes('is not found') || error.message.includes('API version')) {
                 errorMsg = "تنبيه: مفتاح الـ API الخاص بك لا يدعم الذكاء الاصطناعي. يرجى إنشاء مفتاح جديد من Google AI Studio.";
            } else {
                 errorMsg = `عذراً، حدث خطأ في الاتصال. (${error.message})`;
            }
            loadingElement.innerHTML = errorMsg;
        }
    }
}

function appendMessage(content, sender, isHtml = false) {
    const id = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    
    if (sender === 'user') {
        div.className = "bg-sky-500/20 p-3 rounded-2xl border border-sky-500/20 mr-8 text-white text-right break-words self-end shadow-sm";
    } else {
        div.className = "bg-white/5 p-3 rounded-2xl border border-white/10 ml-8 text-slate-300 text-right break-words self-start shadow-sm";
    }
    
    if (isHtml) {
        div.innerHTML = content;
    } else {
        div.textContent = content;
    }
    
    chatContent.appendChild(div);
    chatContent.scrollTop = chatContent.scrollHeight;
    return id;
}

if (sendBtn) sendBtn.onclick = handleChat;
if (aiInput) {
    aiInput.onkeypress = (e) => {
        if (e.key === 'Enter') handleChat();
    };
}

function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
            el.classList.add("active");
        }
    });
}

window.addEventListener("scroll", reveal);