// ==UserScript==
// @name         YouTube Video Summarizer Pro
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extract and summarize YouTube video subtitles using AI
// @author       Your name
// @match        *://*.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    console.log("脚本开始执行");

    // 添加 Markdown 渲染库
    const MARKDOWN_CSS = `
        .markdown-body {
            font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .markdown-body h1 { font-size: 1.5em; margin: .67em 0; }
        .markdown-body h2 { font-size: 1.3em; margin-top: 1em; }
        .markdown-body h3 { font-size: 1.1em; margin-top: 1em; }
        .markdown-body ul { padding-left: 2em; }
        .markdown-body li { margin: 0.2em 0; }
        .markdown-body p { margin: 0.5em 0; }
        .markdown-body code { background-color: rgba(27,31,35,.05); padding: .2em .4em; border-radius: 3px; }
    `;

    // 修改基础样式
    const STYLES = `
        ${MARKDOWN_CSS}
        .yt-summary-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            width: 320px;
            font-family: Roboto, Arial, sans-serif;
            padding: 16px;
            transition: transform 0.3s ease-in-out;
        }
        .yt-summary-panel.collapsed {
            transform: translateX(calc(100% - 40px));
        }
        .yt-summary-collapse-toggle {
            position: absolute;
            left: -20px;
            top: 50%;
            transform: translateY(-50%);
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: -2px 0 8px rgba(0,0,0,0.1);
            transition: background-color 0.2s;
        }
        .yt-summary-collapse-toggle:hover {
            background-color: #f2f2f2;
        }
        .yt-summary-collapse-toggle .arrow {
            border: solid #606060;
            border-width: 0 2px 2px 0;
            display: inline-block;
            padding: 3px;
            transform: rotate(135deg);
            transition: transform 0.3s;
        }
        .yt-summary-panel.collapsed .yt-summary-collapse-toggle .arrow {
            transform: rotate(-45deg);
        }
        .yt-summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .yt-summary-title {
            margin: 0;
            font-size: 16px;
            color: #0f0f0f;
        }
        .yt-summary-settings-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: background-color 0.2s;
        }
        .yt-summary-settings-btn:hover {
            background-color: #f2f2f2;
        }
        .yt-summary-button {
            width: 100%;
            padding: 10px 16px;
            background: #065fd4;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        .yt-summary-button:hover {
            background: #0356c7;
        }
        .yt-summary-settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 30px rgba(0,0,0,0.2);
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 24px;
            display: none;
        }
        .yt-summary-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: none;
        }
        .yt-summary-input {
            width: 100%;
            padding: 8px 12px;
            margin: 4px 0 12px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        .yt-summary-input:focus {
            border-color: #065fd4;
            outline: none;
        }
        .yt-summary-label {
            display: block;
            margin: 8px 0 4px;
            font-size: 14px;
            color: #606060;
        }
        .yt-summary-textarea {
            width: 100%;
            min-height: 120px;
            padding: 12px;
            margin: 4px 0 12px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            resize: vertical;
        }
        .yt-summary-result-container {
            margin-top: 16px;
            max-height: 300px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.5;

        }

         .yt-summary-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            margin: 12px 0;
            font-size: 13px;
            color: #606060;
        }
        .yt-summary-subtitle-section {
            margin: 12px 0;
            border-top: 1px solid #e0e0e0;
            padding-top: 12px;
        }
        .yt-summary-collapse-btn {
            display: flex;
            align-items: center;
            background: none;
            border: none;
            padding: 8px;
            width: 100%;
            cursor: pointer;
            font-size: 14px;
            color: #065fd4;
        }
        .yt-summary-collapse-btn:hover {
            background: #f0f0f0;
            border-radius: 4px;
        }
        .yt-summary-subtitle-content {
            max-height: 200px;
            overflow-y: auto;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.5;
            margin-top: 8px;
            white-space: pre-wrap;
            display: none;
             }
        .yt-summary-arrow {
            margin-right: 8px;
            transition: transform 0.2s;
        }
        .yt-summary-arrow.expanded {
            transform: rotate(90deg);
        }
    `;

    // 配置管理器
    class ConfigManager {
        static KEY = 'yt_summary_config';

        static defaultConfig = {
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            top_p: 1,
            presence_penalty: 0,
            frequency_penalty: 0,
            max_tokens: 2000,
            n: 1,
            stop: null,
            stream: false,
            logit_bias: {},
            prompt: `请分析以下视频字幕内容，并提供以下方面的总结：

1. 视频主要内容概述（100字以内）
2. 关键要点（列出3-5个）
3. 重要结论或见解
4. 实用建议（如果有）

请以结构化的方式呈现，使内容清晰易读。`
        };

        static getConfig() {
            const saved = localStorage.getItem(this.KEY);
            return saved ? { ...this.defaultConfig, ...JSON.parse(saved) } : this.defaultConfig;
        }

        static saveConfig(config) {
            localStorage.setItem(this.KEY, JSON.stringify(config));
        }
    }

    // 字幕管理器
    class SubtitleManager {
        async getSubtitles() {
            try {
                const videoId = new URLSearchParams(window.location.search).get('v');
                if (!videoId) throw new Error('无法获取视频ID');

                // 获取视频页面数据
                const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
                const html = await response.text();

                // 提取ytInitialPlayerResponse
                const ytInitialPlayerResponse = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/)?.[1];
                if (!ytInitialPlayerResponse) throw new Error('无法获取视频信息');

                const data = JSON.parse(ytInitialPlayerResponse);

                // 获取字幕轨道
                const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                if (!captionTracks || captionTracks.length === 0) {
                    throw new Error('该视频没有可用的字幕');
                }

                // 获取字幕内容
                const subtitleUrl = captionTracks[0].baseUrl;
                const subtitleResponse = await fetch(subtitleUrl);
                const subtitleData = await subtitleResponse.text();

                // 使用正则表达式提取字幕文本
                const textMatches = subtitleData.match(/<text[^>]*>(.*?)<\/text>/g) || [];
                const subtitleText = textMatches
                    .map(match => {
                        // 提取文本内容
                        const text = match.replace(/<[^>]+>/g, '')
                            // 直接替换常见的HTML实体
                            .replace(/&quot;/g, '"')
                            .replace(/&apos;/g, "'")
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&amp;/g, '&')
                            .replace(/&#39;/g, "'")
                            .replace(/&#34;/g, '"')
                            // 替换其他数字形式的HTML实体
                            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
                            .trim();
                        return text;
                    })
                    .filter(text => text.length > 0)
                    .join(' ');

                if (!subtitleText) {
                    throw new Error('无法解析字幕内容');
                }

                // 在返回之前添加统计信息
                const subtitleLines = textMatches.length;
                const totalWords = subtitleText.split(/\s+/).length;

                return {
                    text: subtitleText,
                    stats: {
                        lines: subtitleLines,
                        words: totalWords,
                        chars: subtitleText.length,

                        avgLineLength: Math.round(subtitleText.length / subtitleLines)
                    }
                };

            } catch (error) {
                throw new Error(`获取字幕失败: ${error.message}`);
            }
        }
    }

    // AI处理器
    class AIProcessor {
        constructor(config) {
            this.config = config;
        }

        async summarize(text, prompt) {
            try {
                const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.config.model,
                        messages: [
                            {
                                role: 'system',
                                content: '你是一个专业的视频内容分析师，请根据用户的要求提供视频内容总结。'
                            },
                            {
                                role: 'user',
                                content: `${prompt}\n\n内容：${text}`
                            }
                        ],
                        temperature: this.config.temperature,
                        top_p: this.config.top_p
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || '请求失败');
                }

                const data = await response.json();
                return data.choices[0].message.content;
            } catch (error) {
                throw new Error(`AI处理失败: ${error.message}`);
            }
        }
    }

    class UIManager {
        constructor() {
            this.config = ConfigManager.getConfig();
            this.subtitleManager = new SubtitleManager();
            this.aiProcessor = new AIProcessor(this.config);
            this.settingsPanel = null;
            this.overlay = null;
            this.subtitleData = null;
            this.inactivityTimer = null;
        }

        createUI() {
            GM_addStyle(STYLES);

            // 移除已存在的面板
            const existingPanel = document.querySelector('.yt-summary-panel');
            if (existingPanel) {
                existingPanel.remove();
            }

            // 创建主面板
            const panel = document.createElement('div');
            panel.className = 'yt-summary-panel';

            const header = document.createElement('div');
            header.className = 'yt-summary-header';

            const title = document.createElement('h3');
            title.className = 'yt-summary-title';
            title.textContent = '视频总结器';

            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'yt-summary-settings-btn';
            settingsBtn.textContent = '⚙️';
            settingsBtn.onclick = () => this.showSettings();

            // 添加字幕信息区域
            const infoContainer = document.createElement('div');
            infoContainer.className = 'yt-summary-info';

            // 添加字幕内容区域
            const subtitleSection = document.createElement('div');
            subtitleSection.className = 'yt-summary-subtitle-section';

            const collapseBtn = document.createElement('button');
            collapseBtn.className = 'yt-summary-collapse-btn';

            const arrow = document.createElement('span');
            arrow.className = 'yt-summary-arrow';
            arrow.textContent = '▶';

            const btnText = document.createElement('span');
            btnText.textContent = '显示字幕内容';

            collapseBtn.appendChild(arrow);
            collapseBtn.appendChild(btnText);

            const subtitleContent = document.createElement('div');
            subtitleContent.className = 'yt-summary-subtitle-content';

            subtitleSection.appendChild(collapseBtn);
            subtitleSection.appendChild(subtitleContent);


            header.appendChild(title);
            header.appendChild(settingsBtn);
            panel.appendChild(infoContainer);
            panel.appendChild(subtitleSection);

            const summaryBtn = document.createElement('button');
            summaryBtn.className = 'yt-summary-button';
            summaryBtn.textContent = '总结当前视频';

            const resultContainer = document.createElement('div');
            resultContainer.className = 'yt-summary-result-container';

            panel.appendChild(header);

            panel.appendChild(summaryBtn);
            panel.appendChild(infoContainer);
            panel.appendChild(subtitleSection);

            panel.appendChild(resultContainer);

            // 添加折叠按钮
            const collapseToggle = document.createElement('div');
            collapseToggle.className = 'yt-summary-collapse-toggle';
            const arrowSpan = document.createElement('span');
            arrowSpan.className = 'arrow';
            collapseToggle.appendChild(arrowSpan);
            panel.appendChild(collapseToggle);

            // 绑定折叠按钮事件
            collapseToggle.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
            });

            // 添加鼠标移入移出事件
            panel.addEventListener('mouseenter', () => {
                clearTimeout(this.inactivityTimer);
                panel.classList.remove('collapsed');
            });

            panel.addEventListener('mouseleave', () => {
                this.inactivityTimer = setTimeout(() => {
                    panel.classList.add('collapsed');
                }, 5000); // 5秒后自动隐藏
            });

            document.body.appendChild(panel);



            // 创建设置面板和遮罩
            this.createSettingsPanel();
            this.createOverlay();

            collapseBtn.addEventListener('click', () => {
                const isExpanded = subtitleContent.style.display === 'block';
                subtitleContent.style.display = isExpanded ? 'none' : 'block';
                arrow.className = `yt-summary-arrow ${isExpanded ? '' : 'expanded'}`;
                btnText.textContent = isExpanded ? '显示字幕内容' : '隐藏字幕内容';
            });

            // 绑定总结按钮事件
            summaryBtn.addEventListener('click', async () => {
                if (!this.config.apiKey) {
                    alert('请先在设置中配置 API Key');
                    this.showSettings();
                    return;
                }
                await this.handleSummarize(infoContainer, subtitleContent, resultContainer);
            });
        }

        createSettingsPanel() {
            // 创建设置面板
            const panel = document.createElement('div');
            panel.className = 'yt-summary-settings-panel';

            // 标题
            const title = document.createElement('h3');
            title.style.margin = '0 0 20px 0';
            title.style.fontSize = '18px';
            title.textContent = '设置';
            panel.appendChild(title);

            // API Key 设置
            const apiKeyLabel = document.createElement('label');
            apiKeyLabel.className = 'yt-summary-label';
            apiKeyLabel.textContent = 'OpenAI API Key';
            panel.appendChild(apiKeyLabel);

            const apiKeyInput = document.createElement('input');
            apiKeyInput.type = 'password';
            apiKeyInput.className = 'yt-summary-input';
            apiKeyInput.id = 'api-key';
            apiKeyInput.value = this.config.apiKey;
            panel.appendChild(apiKeyInput);

            // Base URL 设置
            const baseUrlLabel = document.createElement('label');
            baseUrlLabel.className = 'yt-summary-label';
            baseUrlLabel.textContent = 'API Base URL';
            panel.appendChild(baseUrlLabel);

            const baseUrlInput = document.createElement('input');
            baseUrlInput.type = 'text';
            baseUrlInput.className = 'yt-summary-input';
            baseUrlInput.id = 'base-url';
            baseUrlInput.value = this.config.baseUrl;
            panel.appendChild(baseUrlInput);

            // 模型设置
            const modelLabel = document.createElement('label');
            modelLabel.className = 'yt-summary-label';
            modelLabel.textContent = 'AI 模型';
            panel.appendChild(modelLabel);

            const modelInput = document.createElement('input');
            modelInput.type = 'text';
            modelInput.className = 'yt-summary-input';
            modelInput.id = 'model';
            modelInput.value = this.config.model;
            panel.appendChild(modelInput);

            // 提示词设置
            const promptLabel = document.createElement('label');
            promptLabel.className = 'yt-summary-label';
            promptLabel.textContent = '提示词';
            panel.appendChild(promptLabel);

            const promptInput = document.createElement('textarea');
            promptInput.className = 'yt-summary-textarea';
            promptInput.id = 'prompt';
            promptInput.value = this.config.prompt;
            panel.appendChild(promptInput);

            // 高级设置折叠区域
            const advancedSettingsBtn = document.createElement('button');
            advancedSettingsBtn.className = 'yt-summary-collapse-btn';
            advancedSettingsBtn.style.marginTop = '16px';

            const advancedArrow = document.createElement('span');
            advancedArrow.className = 'yt-summary-arrow';
            advancedArrow.textContent = '▶';

            const advancedBtnText = document.createElement('span');
            advancedBtnText.textContent = '高级设置';

            advancedSettingsBtn.appendChild(advancedArrow);
            advancedSettingsBtn.appendChild(advancedBtnText);
            panel.appendChild(advancedSettingsBtn);

            const advancedSettingsContent = document.createElement('div');
            advancedSettingsContent.style.display = 'none';
            advancedSettingsContent.style.padding = '12px';
            advancedSettingsContent.style.backgroundColor = '#f8f9fa';
            advancedSettingsContent.style.borderRadius = '8px';
            advancedSettingsContent.style.marginTop = '8px';

            // Temperature 设置
            const temperatureLabel = document.createElement('label');
            temperatureLabel.className = 'yt-summary-label';
            temperatureLabel.textContent = 'Temperature';
            advancedSettingsContent.appendChild(temperatureLabel);

            const temperatureInput = document.createElement('input');
            temperatureInput.type = 'number';
            temperatureInput.className = 'yt-summary-input';
            temperatureInput.id = 'temperature';
            temperatureInput.value = this.config.temperature || '0.7';
            temperatureInput.step = '0.1';
            temperatureInput.min = '0';
            temperatureInput.max = '2';
            advancedSettingsContent.appendChild(temperatureInput);

            // Top P 设置
            const topPLabel = document.createElement('label');
            topPLabel.className = 'yt-summary-label';
            topPLabel.textContent = 'Top P';
            advancedSettingsContent.appendChild(topPLabel);

            const topPInput = document.createElement('input');
            topPInput.type = 'number';
            topPInput.className = 'yt-summary-input';
            topPInput.id = 'top_p';
            topPInput.value = this.config.top_p || '1';
            topPInput.step = '0.1';
            topPInput.min = '0';
            topPInput.max = '1';
            advancedSettingsContent.appendChild(topPInput);

            const presencePenalty = document.createElement('label');
            presencePenalty.className = 'yt-summary-label';
            presencePenalty.textContent = 'PresencePenalty';
            advancedSettingsContent.appendChild(presencePenalty);

            const presencePenaltyInput = document.createElement('input');
            presencePenaltyInput.type = 'number';
            presencePenaltyInput.className = 'yt-summary-input';
            presencePenaltyInput.id = 'presence_penalty';
            presencePenaltyInput.value = this.config.presence_penalty || '0';
            presencePenaltyInput.step = '0.1';
            presencePenaltyInput.min = '0';
            presencePenaltyInput.max = '1';
            advancedSettingsContent.appendChild(presencePenaltyInput);

            const frequencyPenaltyLabel = document.createElement('label');
            frequencyPenaltyLabel.className = 'yt-summary-label';
            frequencyPenaltyLabel.textContent = 'FrequencyPenalty';
            advancedSettingsContent.appendChild(frequencyPenaltyLabel);

            const frequencyPenaltyInput = document.createElement('input');
            frequencyPenaltyInput.type = 'number';
            frequencyPenaltyInput.className = 'yt-summary-input';

            frequencyPenaltyInput.id = 'presence_penalty';
            frequencyPenaltyInput.value = this.config.presence_penalty || '0';
            frequencyPenaltyInput.step = '0.1';
            frequencyPenaltyInput.min = '0';
            frequencyPenaltyInput.max = '1';
            advancedSettingsContent.appendChild(frequencyPenaltyInput);


            const MaxTokensLabel = document.createElement('label');
            MaxTokensLabel.className = 'yt-summary-label';
            MaxTokensLabel.textContent = 'MaxTokensLabel';
            advancedSettingsContent.appendChild(MaxTokensLabel);

            const maxTokensInput = document.createElement('input');
            maxTokensInput.type = 'number';
            maxTokensInput.className = 'yt-summary-input';

            maxTokensInput.id = 'max_tokens';
            maxTokensInput.value = this.config.presence_penalty || '4096';
            maxTokensInput.step = '1';
            maxTokensInput.min = '4096';
            maxTokensInput.max = '80000';

            advancedSettingsContent.appendChild(maxTokensInput)


            panel.appendChild(advancedSettingsContent);

            // 添加高级设置折叠功能
            advancedSettingsBtn.addEventListener('click', () => {
                const isExpanded = advancedSettingsContent.style.display === 'block';
                advancedSettingsContent.style.display = isExpanded ? 'none' : 'block';
                advancedArrow.className = `yt-summary-arrow ${isExpanded ? '' : 'expanded'}`;
            });

            // 保存按钮
            const saveBtn = document.createElement('button');
            saveBtn.className = 'yt-summary-button';
            saveBtn.style.marginTop = '20px';
            saveBtn.textContent = '保存设置';
            saveBtn.onclick = () => {
                this.config = {
                    ...this.config,
                    apiKey: apiKeyInput.value,
                    baseUrl: baseUrlInput.value,
                    model: modelInput.value,
                    temperature: parseFloat(temperatureInput.value),
                    top_p: parseFloat(topPInput.value),
                    presence_penalty: parseFloat(presencePenaltyInput.value),
                    frequency_penalty: parseFloat(frequencyPenaltyInput.value),
                    max_tokens: parseInt(maxTokensInput.value),

                    prompt: promptInput.value
                };
                ConfigManager.saveConfig(this.config);
                this.aiProcessor = new AIProcessor(this.config);
                this.hideSettings();
            };

            panel.appendChild(saveBtn);
            this.settingsPanel = panel;
            document.body.appendChild(panel);
        }

        createOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'yt-summary-overlay';
            overlay.onclick = () => this.hideSettings();
            document.body.appendChild(overlay);
            this.overlay = overlay;
        }

        showSettings() {
            if (this.settingsPanel && this.overlay) {
                this.settingsPanel.style.display = 'block';
                this.overlay.style.display = 'block';
            }
        }

        hideSettings() {
            if (this.settingsPanel && this.overlay) {
                this.settingsPanel.style.display = 'none';
                this.overlay.style.display = 'none';
            }
        }

        saveSettings() {
            this.config = {
                apiKey: document.getElementById('api-key').value,
                baseUrl: document.getElementById('base-url').value,
                model: document.getElementById('model').value,
                prompt: document.getElementById('prompt').value
            };
            ConfigManager.saveConfig(this.config);
            this.aiProcessor = new AIProcessor(this.config);
        }

        async handleSummarize(infoContainer, subtitleContent, resultContainer) {
            try {
                // 清空之前的内容
                resultContainer.textContent = '正在获取字幕...';
                infoContainer.textContent = '';
                subtitleContent.textContent = '';

                // 获取字幕
                const subtitleData = await this.subtitleManager.getSubtitles();
                this.subtitleData = subtitleData;

                // 更新字幕信息
                infoContainer.textContent = `字幕统计：${subtitleData.stats.lines} 行 | ${subtitleData.stats.words} 个词 | ${subtitleData.stats.chars} 个字符`;

                // 更新字幕内容
                subtitleContent.textContent = subtitleData.text;

                // 生成总结
                resultContainer.textContent = '正在生成总结...';
                const summary = await this.aiProcessor.summarize(subtitleData.text, this.config.prompt);

                // 显示总结结果
                const summaryContent = this.renderMarkdown(summary);
                resultContainer.textContent = '';
                resultContainer.appendChild(summaryContent);
            } catch (error) {
                resultContainer.textContent = `错误：${error.message}`;
                infoContainer.textContent = '获取字幕失败';
            }
        }

        renderMarkdown(markdown) {
            const container = document.createElement('div');
            container.className = 'markdown-body';

            const lines = markdown.split('\n');

            lines.forEach(line => {
                if (!line.trim()) {
                    // 处理空行
                    container.appendChild(document.createElement('br'));
                    return;
                }

                if (line.startsWith('### ')) {
                    const h3 = document.createElement('h3');
                    h3.textContent = line.slice(4);
                    container.appendChild(h3);
                    return;
                }

                if (line.startsWith('## ')) {
                    const h2 = document.createElement('h2');
                    h2.textContent = line.slice(3);
                    container.appendChild(h2);
                    return;
                }

                if (line.startsWith('# ')) {
                    const h1 = document.createElement('h1');
                    h1.textContent = line.slice(2);
                    container.appendChild(h1);
                    return;
                }

                if (line.startsWith('- ')) {
                    const ul = document.createElement('ul');
                    const li = document.createElement('li');
                    li.textContent = line.slice(2);
                    ul.appendChild(li);
                    container.appendChild(ul);
                    return;
                }

                if (/^\d+\. /.test(line)) {
                    const ol = document.createElement('ol');
                    const li = document.createElement('li');
                    li.textContent = line.replace(/^\d+\. /, '');
                    ol.appendChild(li);
                    container.appendChild(ol);
                    return;
                }

                // 处理普通段落
                const p = document.createElement('p');
                let text = line;
                let lastIndex = 0;
                let match;

                // 处理加粗
                const boldRegex = /\*\*(.+?)\*\*/g;
                while ((match = boldRegex.exec(text)) !== null) {
                    // 添加前面的普通文本
                    if (match.index > lastIndex) {
                        p.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                    }

                    // 添加加粗文本
                    const strong = document.createElement('strong');
                    strong.textContent = match[1];
                    p.appendChild(strong);

                    lastIndex = match.index + match[0].length;
                }

                // 添加剩余的文本
                if (lastIndex < text.length) {
                    p.appendChild(document.createTextNode(text.slice(lastIndex)));
                }

                container.appendChild(p);
            });

            return container;
        }

        makeDraggable(dragHandle) {
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;

            dragHandle.addEventListener('mousedown', (e) => {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                if (e.target === dragHandle) {
                    isDragging = true;
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    xOffset = currentX;
                    yOffset = currentY;
                    this.container.style.transform = `translate(${currentX}px, ${currentY}px)`;
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }
    }

    // 修改初始化逻辑
    function waitForYouTube() {
        console.log("等待YouTube页面加载...");

        // 检查是否是视频页面
        if (!window.location.pathname.includes('/watch')) {
            console.log("不是视频页面，不初始化");
            return;
        }

        // 检查必要的DOM元素
        if (document.querySelector('#movie_player')) {
            console.log("找到播放器，开始初始化");
            const ui = new UIManager();
            ui.createUI();
        } else {
            console.log("未找到播放器，等待加载");
            setTimeout(waitForYouTube, 1000);
        }
    }

    // 使用多种方式确保脚本执行
    function bootloader() {
        console.log("启动加载器");

        // 方式1: DOMContentLoaded
        if (document.readyState === 'loading') {
            console.log("等待DOMContentLoaded");
            document.addEventListener('DOMContentLoaded', waitForYouTube);
        } else {
            console.log("文档已加载，直接执行");
            waitForYouTube();
        }

        // 方式2: load 事件
        window.addEventListener('load', waitForYouTube);

        // 方式3: 定时检查
        setTimeout(waitForYouTube, 2000);
    }

    // 启动脚本
    bootloader();

    // 处理YouTube的SPA导航
    const pushStateOriginal = history.pushState;
    history.pushState = function () {
        pushStateOriginal.apply(this, arguments);
        console.log("检测到页面导航");
        setTimeout(waitForYouTube, 1000);
    };
})();