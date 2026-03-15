import React, { useState } from 'react';
import './PromoSection.css'; // Assuming the CSS from promo-section.html is saved here
// Requires FontAwesome to be loaded in the app or via react-icons

const PromoSection = () => {
    const [activeFaq, setActiveFaq] = useState(null);

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "Ultimate Convenience",
            answer: "Order medicines from the comfort of your home. Whether it's raining outside or you're unwell, your medication is just a click away, arriving right at your doorstep."
        },
        {
            question: "24×7 Platform Availability",
            answer: "Our digital storefront never closes. You can browse, verify prescriptions, and place orders at any hour of the day or night that suits your schedule."
        },
        {
            question: "Wide Product Selection",
            answer: "Beyond just prescriptions, access an immense catalog of healthcare, wellness, and personal care products that might not all fit in a physical retail store."
        },
        {
            question: "Detailed Product Information",
            answer: "Every product page includes comprehensive details about usage instructions, potential side effects, contraindications, and active ingredients to keep you fully informed."
        },
        {
            question: "Secure Payment Options",
            answer: "Pay the way you prefer. We support highly secure payment gateways including Credit/Debit Cards, UPI, Mobile Wallets, and Cash on Delivery (COD)."
        }
    ];

    return (
        <div className="promo-section-container">
            {/* 1. Best Online Medicine Store in India */}
            <div className="info-row">
                <div className="info-content">
                    <h2>Best Online Medicine Store in India</h2>
                    <p>Welcome to your trusted online medicine store in India. We are dedicated to providing a wide range of authentic medicines and healthcare products right to your doorstep. Our platform ensures that you have access to everything you need for a healthy life.</p>
                    <p>We provide a comprehensive selection of products, including:</p>
                    <ul>
                        <li><strong>OTC Medicines</strong> for immediate relief</li>
                        <li><strong>Vitamins & Supplements</strong> to boost immunity</li>
                        <li><strong>Hygiene Products</strong> for personal wellness</li>
                        <li><strong>Baby Care Products</strong> for your little ones</li>
                        <li><strong>Self-care Products</strong> for daily grooming</li>
                        <li><strong>Pet Supplies</strong> to keep your furry friends healthy</li>
                    </ul>
                    <p><strong>Quality Assurance:</strong> All our medicines are sourced directly from trusted brands and certified manufacturers. You can rest assured you are receiving safe and high-quality products. Furthermore, our <strong>Pharmacist-On-Call service</strong> is always available to answer your prescription queries and provide expert guidance.</p>
                </div>
                <div className="info-image">
                    <i className="fas fa-prescription-bottle-medical"></i>
                </div>
            </div>

            {/* 2. Reasons to Buy Medicine Online */}
            <div className="promo-header">
                <h2>Reasons to Buy Medicine Online</h2>
                <p>Experience the modern way of managing your healthcare needs with our digital pharmacy platform.</p>
            </div>
            
            <div className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon"><i className="fas fa-tags"></i></div>
                    <h3>Competitive Pricing</h3>
                    <p>Enjoy affordable pricing and regular discounts on all your essential medicines and healthcare products. We make healthcare accessible for everyone.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><i className="fas fa-clock"></i></div>
                    <h3>24×7 Availability</h3>
                    <p>Order medicines anytime, day or night. No more searching for nearby medical stores or waiting in long pharmacy queues.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><i className="fas fa-calendar-alt"></i></div>
                    <h3>Scheduled Reminders</h3>
                    <p>Never miss a dose again. Receive automated reminders for your prescription refills and regular daily medication schedules.</p>
                </div>
            </div>

            {/* 3. Easy and Quick Delivery & 5. Why Choose Us */}
            <div className="info-row" style={{ flexDirection: 'row-reverse' }}>
                <div className="info-content">
                    <h2>Easy & Quick Online Medicine Delivery</h2>
                    <p>We understand the importance of timely access to medication. That’s why we offer fast, reliable delivery through our wide partner network available across many cities in India, including <strong>same-day delivery options</strong> for urgent needs.</p>
                    
                    <h3 style={{ marginTop: '2.5rem', color: 'var(--primary-color)' }}>Why Choose Us?</h3>
                    <ul>
                        <li><strong>Reliable Delivery:</strong> Track your order from our store to your door.</li>
                        <li><strong>Quality Assurance:</strong> 100% genuine products from trusted manufacturers.</li>
                        <li><strong>Responsive Support:</strong> 24/7 Customer support via Phone or WhatsApp.</li>
                        <li><strong>Affordable Pricing:</strong> Transparent pricing with regular discounts.</li>
                    </ul>
                </div>
                <div className="info-image">
                    <i className="fas fa-truck-fast"></i>
                </div>
            </div>

            {/* 4. Extra Benefits Section (FAQ Style / Accordion) */}
            <div className="faq-section">
                <div className="faq-header">
                    <h2>Extra Benefits of Online Ordering</h2>
                </div>
                
                {faqs.map((faq, index) => (
                    <div className="faq-item" key={index}>
                        <button 
                            className={`faq-question ${activeFaq === index ? 'active' : ''}`}
                            onClick={() => toggleFaq(index)}
                        >
                            {faq.question}
                            <i className="fas fa-chevron-down"></i>
                        </button>
                        <div 
                            className={`faq-answer ${activeFaq === index ? 'active' : ''}`}
                            style={{ maxHeight: activeFaq === index ? '200px' : '0' }}
                        >
                            {faq.answer}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromoSection;
