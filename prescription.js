// prescription.js — Pharmacist AI Chatbot only

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput   = document.getElementById('chat-input');
    const sendBtn     = document.getElementById('send-btn');

    // Update cart count in header
    const cart = JSON.parse(localStorage.getItem('sdm_cart')) || [];
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);

    // ---- Quick question chips ----
    window.askQuestion = function(question) {
        chatInput.value = question;
        handleChatSubmit();
    };

    sendBtn.addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleChatSubmit(); });

    function handleChatSubmit() {
        const text = chatInput.value.trim();
        if (!text) return;
        addUserMessage(text);
        chatInput.value = '';
        setTimeout(() => addBotMessage(getBotReply(text.toLowerCase())), 700);
    }

    // ---- Smart local responses ----
    function getBotReply(q) {
        if (q.includes('paracetamol') || q.includes('dolo') || q.includes('crocin') || q.includes('calpol')) {
            if (q.includes('side effect') || q.includes('harm') || q.includes('safe'))
                return "Paracetamol (Dolo/Crocin) is generally very safe at recommended doses. Common side effects at high doses include liver strain. Avoid exceeding 4g per day. It is safe for most adults and children when used correctly.";
            if (q.includes('dosage') || q.includes('dose') || q.includes('how much') || q.includes('how many'))
                return "Dolo 650 contains 650mg of Paracetamol. Adults can take 1 tablet every 4–6 hours as needed, up to a maximum of 4 tablets per day. Always take with or after food.";
            return "Paracetamol is a widely used pain reliever and fever reducer. Dolo 650, Crocin, and Calpol are all branded versions of the same active ingredient. Let me know if you have a specific question!";
        }
        if (q.includes('ibuprofen') || q.includes('brufen') || q.includes('combiflam')) {
            if (q.includes('paracetamol') || q.includes('together') || q.includes('mix') || q.includes('combine'))
                return "Yes, Ibuprofen and Paracetamol can generally be taken together as they work through different mechanisms. However, always consult your doctor before combining medicines. The combination is found in Combiflam tablets.";
            if (q.includes('side effect'))
                return "Ibuprofen may cause stomach irritation, nausea, or heartburn, especially on an empty stomach. Always take with food. Avoid if you have kidney issues or gastric ulcers.";
            return "Ibuprofen is an anti-inflammatory (NSAID) useful for pain, swelling, and fever. Brufen 400 and Combiflam are common brands available at SDM Brothers.";
        }
        if (q.includes('antibiotic') || q.includes('amoxicillin') || q.includes('azithromycin')) {
            if (q.includes('prescription') || q.includes('without') || q.includes('need'))
                return "⚠️ Yes, antibiotics are prescription-only medicines. A valid doctor's prescription is required to purchase them at our pharmacy. Self-medicating with antibiotics is dangerous and can lead to antibiotic resistance.";
            return "Antibiotics are used to treat bacterial infections and must only be taken under a doctor's supervision. Please upload a valid prescription to purchase antibiotic medicines from SDM Brothers.";
        }
        if (q.includes('fever') || q.includes('temperature')) {
            return "For fever, commonly recommended medicines include:\n• Paracetamol (Dolo 650, Crocin) — first line treatment\n• Combiflam — for fever with body pain\n• Stay well-hydrated and rest.\nIf fever exceeds 103°F or lasts more than 3 days, please consult a doctor immediately.";
        }
        if (q.includes('cold') || q.includes('flu') || q.includes('cough') || q.includes('sneez')) {
            return "For cold and flu symptoms I recommend:\n• Vicks Action 500 for multi-symptom relief\n• Cetirizine for runny nose and sneezing\n• Benadryl or Chericof for cough\n• Rest and warm fluids help a lot!\nPersistent symptoms beyond a week should be checked by a doctor.";
        }
        if (q.includes('diabetes') || q.includes('sugar') || q.includes('insulin') || q.includes('metformin')) {
            return "Diabetes medicines like Metformin, Glipizide, and Insulin are available at SDM Brothers. These require a valid prescription. It is very important not to adjust your dosage without consulting your endocrinologist. Would you like more info?";
        }
        if (q.includes('vitamin') || q.includes('supplement') || q.includes('zinc') || q.includes('calcium')) {
            return "We stock a wide range of vitamins and supplements including Vitamin C, D3, B12, Zinc, and Calcium tablets. These are available over the counter without a prescription. They're great for immunity and general wellness!";
        }
        if (q.includes('blood pressure') || q.includes('hypertension') || q.includes('bp')) {
            return "Blood pressure medicines (like Amlodipine, Losartan, Telmisartan) require a doctor's prescription. It's very important to take them consistently and never stop without consulting your doctor. Regular BP monitoring is recommended.";
        }
        if (q.includes('alternative') || q.includes('generic') || q.includes('substitute') || q.includes('cheaper')) {
            return "We carry many affordable generic equivalents for branded medicines. Just tell me the medicine name and I'll suggest the best available alternative at SDM Brothers at a lower price!";
        }
        if (q.includes('thank') || q.includes('thanks') || q.includes('helpful')) {
            return "You're very welcome! 😊 Stay healthy and don't hesitate to reach out anytime. SDM Brothers is always here to help with your pharmacy needs!";
        }
        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
            return "Hello! 👋 How can I help you today? You can ask me about medicine names, dosages, side effects, drug interactions, or anything pharmacy-related!";
        }
        return `Thank you for your question about "${chatInput.value || q}". For specific medical advice, I recommend consulting with one of our in-store pharmacists or your doctor. You can also call any SDM Brothers branch directly. Is there anything else I can help with?`;
    }

    function addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'msg bot';
        div.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'msg user';
        div.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
