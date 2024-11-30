import { useNavigate } from "react-router-dom";
import { useState } from 'react';
import './style.css'
import CommonHeader from "../../Common/CommonHeader/index.js";
import Fox from '../../Assets/Fox.png'
import { FaArrowRight, FaRegUser } from "react-icons/fa";

export default function Assists() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { type: "bot", message: "Welcome to Grants Assist! What can I help you with today?" }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEventStream = async (userQuery) => {
        const url = 'http://app.infox.bot/api/relay_chat/';
        let fullMessage = '';
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({ query: userQuery })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                try {
                    const data = JSON.parse(chunk);
                    if (data.data) {
                        fullMessage += data.data;
                        setMessages(prev => [
                            ...prev.slice(0, -1),
                            { type: "bot", message: fullMessage }
                        ]);
                    }
                } catch (e) {
                    const lines = chunk.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.data) {
                                fullMessage += data.data;
                                setMessages(prev => [
                                    ...prev.slice(0, -1),
                                    { type: "bot", message: fullMessage }
                                ]);
                            }
                        } catch (innerError) {
                            console.error('Parsing line failed:', innerError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream error:', error);
            setMessages(prev => [
                ...prev,
                { type: "bot", message: "Sorry, I encountered an error. Please try again." }
            ]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        setMessages(prev => [...prev, { type: "user", message: inputText }]);
        
        setMessages(prev => [...prev, { type: "bot", message: "..." }]);
        
        setIsLoading(true);
        try {
            await handleEventStream(inputText);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsLoading(false);
        }
        setInputText('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div>
            <CommonHeader />
            <div className="context">
                <div className="text-area">
                    {messages.map((ele, index) => (
                        <div key={index} className="message-container">
                            {ele.type === "bot" ? (
                                <div className="botMessage">
                                    <img src={Fox} alt="" height={36} width={36} />
                                    <span className="message-text">{ele.message}</span>
                                </div>
                            ) : (
                                <div className="userMessage">
                                    <span className="message-text">{ele.message}</span>
                                    <div className="user-icon-container">
                                        <FaRegUser className="user-icon" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {/* <div className="tooltips">
                    <div className="tooltip-card">
                        <span>Vacation</span>
                    </div>
                    <div className="tooltip-card">
                        <span>Payroll</span>
                    </div>
                    <div className="tooltip-card">
                        <span>Insurance</span>
                    </div>
                    <div className="tooltip-card">
                        <span>Terminations & Layoffs</span>
                    </div>
                    <div className="tooltip-card">
                        <span>Maternity & Paternity Leaves</span>
                    </div>
                </div> */}
                <form onSubmit={handleSubmit} className="pt-site-footer__submit">
                    <input
                        type="text"
                        placeholder="Message Infox"
                        className="searchKeyText"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        className="send-btn" 
                        disabled={isLoading}
                    >
                        <FaArrowRight />
                    </button>
                </form>
            </div>
        </div>
    );
}