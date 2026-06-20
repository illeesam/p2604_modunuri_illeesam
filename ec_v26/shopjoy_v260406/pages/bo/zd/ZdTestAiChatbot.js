/**
 * 개발도구 — AI 챗봇 (OpenAI / Claude) 테스트
 */
window.ZdTestAiChatbot = {
  name: 'ZdTestAiChatbot',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted, nextTick } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      provider:        'openai',  // openai | claude
      openaiApiKey:    '',
      openaiModel:     'gpt-4o-mini',
      claudeApiKey:    '',
      claudeModel:     'claude-haiku-4-5-20251001',
      systemPrompt:    '당신은 ShopJoy 쇼핑몰의 친절한 AI 고객 상담원입니다. 상품, 주문, 배송, 반품에 관한 질문에 간결하게 답변하세요.',
      maxTokens:       512,
      temperature:     0.7,
    });

    const form = reactive({ userMsg: '' });

    const result = reactive({
      messages:  [],  // { role: 'user'|'assistant'|'system', content, time }
      status:    '',
      error:     '',
      usage:     null,
    });

    const uiState = reactive({ loading: false });


    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.ai.openai.api-key,app.ai.openai.model,app.ai.claude.api-key,app.ai.claude.model',
        }, 'AI 챗봇 테스트', '키 조회');
        const list = res?.data?.data || [];
        list.forEach(p => {
          if (p.propKey === 'app.ai.openai.api-key') cfg.openaiApiKey = p.propValue || '';
          if (p.propKey === 'app.ai.openai.model')   cfg.openaiModel  = p.propValue || cfg.openaiModel;
          if (p.propKey === 'app.ai.claude.api-key') cfg.claudeApiKey = p.propValue || '';
          if (p.propKey === 'app.ai.claude.model')   cfg.claudeModel  = p.propValue || cfg.claudeModel;
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const scrollBottom = () => {
      nextTick(() => {
        const el = document.getElementById('zd-chat-messages');
        if (el) el.scrollTop = el.scrollHeight;
      });
    };

    const sendMessage = async () => {
      if (!form.userMsg.trim()) return;
      const userText = form.userMsg.trim();
      form.userMsg = '';
      result.messages.push({ role: 'user', content: userText, time: new Date().toLocaleTimeString() });
      scrollBottom();
      uiState.loading = true;
      result.status   = '⏳ AI 응답 대기 중…';
      result.error    = '';
      try {
        const res = await boApi.post('/bo/sy/test/ai/chat', {
          provider:     cfg.provider,
          model:        cfg.provider === 'openai' ? cfg.openaiModel : cfg.claudeModel,
          systemPrompt: cfg.systemPrompt,
          messages:     result.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
          maxTokens:    cfg.maxTokens,
          temperature:  cfg.temperature,
        }, coUtil.cofApiHdr('AI 챗봇 테스트', '메시지 전송'));
        const d = res.data?.data || {};
        result.messages.push({ role: 'assistant', content: d.content || '(응답 없음)', time: new Date().toLocaleTimeString() });
        result.usage  = d.usage || null;
        result.status = '✅ 응답 완료';
        scrollBottom();
      } catch (e) {
        result.error = e.response?.data?.message || e.message || '오류 발생';
        result.messages.push({ role: 'system', content: '❌ ' + result.error, time: new Date().toLocaleTimeString() });
        result.status = '❌ 오류';
        showToast(result.error, 'error', 0);
        scrollBottom();
      }
      uiState.loading = false;
    };

    const clearChat = () => { result.messages = []; result.usage = null; result.status = ''; result.error = ''; };

    const saveKey = async () => {
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.ai.openai.api-key', propValue: cfg.openaiApiKey },
          { propKey: 'app.ai.openai.model',   propValue: cfg.openaiModel },
          { propKey: 'app.ai.claude.api-key', propValue: cfg.claudeApiKey },
          { propKey: 'app.ai.claude.model',   propValue: cfg.claudeModel },
        ], coUtil.cofApiHdr('AI 챗봇 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    const onKeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'send')      return sendMessage();
      if (cmd === 'clear')     return clearChat();
      if (cmd === 'key-save')  return saveKey();
    };

    return { cfg, form, result, uiState, handleBtnAction, onKeydown };
  },

  template: `
<div>
  <div class="page-title">AI 챗봇 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">AI 설정</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:0 0 140px">
          <label class="form-label">Provider</label>
          <select class="form-control" v-model="cfg.provider">
            <option value="openai">OpenAI (GPT)</option>
            <option value="claude">Anthropic (Claude)</option>
          </select>
        </div>
        <div class="form-group" style="flex:1" v-if="cfg.provider === 'openai'">
          <label class="form-label">OpenAI API Key</label>
          <input class="form-control" type="password" v-model="cfg.openaiApiKey" placeholder="sk-…" />
        </div>
        <div class="form-group" style="flex:0 0 200px" v-if="cfg.provider === 'openai'">
          <label class="form-label">모델</label>
          <input class="form-control" v-model="cfg.openaiModel" placeholder="gpt-4o-mini" />
        </div>
        <div class="form-group" style="flex:1" v-if="cfg.provider === 'claude'">
          <label class="form-label">Anthropic API Key</label>
          <input class="form-control" type="password" v-model="cfg.claudeApiKey" placeholder="sk-ant-…" />
        </div>
        <div class="form-group" style="flex:0 0 240px" v-if="cfg.provider === 'claude'">
          <label class="form-label">모델</label>
          <input class="form-control" v-model="cfg.claudeModel" placeholder="claude-haiku-4-5-20251001" />
        </div>
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">System Prompt</label>
          <textarea class="form-control" v-model="cfg.systemPrompt" rows="2" style="font-size:12px;resize:vertical"></textarea>
        </div>
        <div class="form-group" style="flex:0 0 100px">
          <label class="form-label">Max Tokens</label>
          <input class="form-control" type="number" v-model="cfg.maxTokens" min="64" max="4096" step="64" />
        </div>
        <div class="form-group" style="flex:0 0 100px">
          <label class="form-label">Temperature</label>
          <input class="form-control" type="number" v-model="cfg.temperature" min="0" max="2" step="0.1" />
        </div>
      </div>
      <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
    </div>
  </div>

  <!-- 채팅 창 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">채팅</span>
      <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <span v-if="result.usage" style="font-size:11px;color:#888">
          토큰: 입력 {{ result.usage.promptTokens || result.usage.input_tokens || '-' }} / 출력 {{ result.usage.completionTokens || result.usage.output_tokens || '-' }}
        </span>
        <button class="btn btn_reset" @click="handleBtnAction('clear')">대화 초기화</button>
      </div>
    </div>
    <div style="padding:12px">
      <!-- 메시지 목록 -->
      <div id="zd-chat-messages" style="height:360px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;padding:12px;background:#fafafa;display:flex;flex-direction:column;gap:8px;margin-bottom:8px">
        <div v-if="!result.messages.length" style="color:#999;font-size:12px;text-align:center;margin:auto">
          메시지를 입력하여 AI 와 대화를 시작하세요
        </div>
        <div v-for="(m, idx) in result.messages" :key="idx"
          :style="m.role==='user'?'align-self:flex-end':m.role==='system'?'align-self:center':'align-self:flex-start'">
          <div :style="m.role==='user'?'background:#2563eb;color:#fff;border-radius:12px 12px 2px 12px;padding:8px 12px;max-width:420px;font-size:13px;white-space:pre-wrap':m.role==='system'?'background:#fef9c3;color:#92400e;border-radius:6px;padding:6px 10px;font-size:11px':' background:#fff;border:1px solid #e5e7eb;border-radius:2px 12px 12px 12px;padding:8px 12px;max-width:480px;font-size:13px;white-space:pre-wrap'">
            {{ m.content }}
          </div>
          <div style="font-size:10px;color:#bbb;margin-top:2px;text-align:right">{{ m.time }}</div>
        </div>
        <div v-if="uiState.loading" style="align-self:flex-start">
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:2px 12px 12px 12px;padding:8px 12px;font-size:13px;color:#888">
            ⏳ 생각 중…
          </div>
        </div>
      </div>
      <!-- 입력창 -->
      <div style="display:flex;gap:6px">
        <textarea class="form-control" v-model="form.userMsg" rows="2"
          placeholder="메시지 입력 (Enter: 전송 / Shift+Enter: 줄바꿈)"
          style="flex:1;font-size:13px;resize:none"
          @keydown="onKeydown" :disabled="uiState.loading"></textarea>
        <button class="btn btn_send" style="align-self:flex-end" :disabled="uiState.loading || !form.userMsg.trim()" @click="handleBtnAction('send')">
          전송
        </button>
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>OpenAI:</b> platform.openai.com → API Keys → sy_prop <code>app.ai.openai.api-key</code><br>
      <b>Claude:</b> console.anthropic.com → API Keys → sy_prop <code>app.ai.claude.api-key</code><br><br>
      <b>백엔드 API:</b> <code>POST /api/bo/sy/test/ai/chat</code><br>
      provider=openai → OpenAI Chat Completions API 프록시<br>
      provider=claude → Anthropic Messages API 프록시 (API 키 서버 보관, CORS 우회)
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/all" title="application.yml — AI 챗봇 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.ai." default-prop-key-filter="app.ai." />
</div>`,
};
