/*ENGINE-START*/
(function (root) {
  'use strict';
  const SRC = {
    nice: { label: 'NICE NG123', href: 'https://www.nice.org.uk/guidance/ng123/chapter/recommendations' },
    auaOab: { label: 'AUA/SUFU 2024 OAB', href: 'https://www.auanet.org/documents/Guidelines/PDF/2024%20Guidelines/OAB%202024%20Unabridgedv2.pdf' },
    auaSui: { label: 'AUA/SUFU 2023 SUI', href: 'https://www.auanet.org/documents/Guidelines/PDF/2023%20Guidelines/SUI%20Unabridged%20FINAL%20080223.pdf' },
    iuga: { label: 'IUGA POP 評估', href: 'https://www.iuga.org/publications/iuc/chapter-2-evaluation-of-the-patient-with-pelvic-organ-prolapse' }
  };

  const FLAGS = {
    haematuria: { label: '血尿', action: '血尿依 NICE NG12 可疑泌尿道癌症轉介路徑處理（NG123 1.3.21），不可當作單純 OAB。', src: 'NICE 1.3.21' },
    rUTI: { label: '反覆／持續 UTI', action: '反覆或持續不明原因 UTI 依可疑癌症路徑評估，並測殘尿（膀胱掃描優先，1.3.10–1.3.11）。', src: 'NICE 1.3.10・1.3.21' },
    voiding: { label: '排尿困難／疑滯留', action: '測殘尿（膀胱掃描優先於導尿）；排尿困難屬專科轉介指標。抗膽鹼藥對尿滯留病史須極度小心。', src: 'NICE 1.3.10・1.3.20・AUA OAB 19' },
    palpable: { label: '解尿後可觸及膀胱', action: '解尿後仍可觸及膀胱，轉介專科。', src: 'NICE 1.3.20' },
    neuro: { label: '疑神經學疾病', action: '疑神經性下泌尿道功能障礙，轉介專科；不適用特發性 OAB 指引。', src: 'NICE 1.3.20' },
    mass: { label: '骨盆腫塊', action: '排除骨盆腫塊或其他病理（含卵巢癌與膀胱癌可疑路徑），轉介專科。', src: 'NICE 1.3.20・1.6.1' },
    pain: { label: '持續膀胱／尿道疼痛', action: '持續膀胱或尿道疼痛，轉介專科評估。', src: 'NICE 1.3.20' },
    fistula: { label: '疑瘻管', action: '持續漏尿疑泌尿生殖瘻管，轉介專科。', src: 'NICE 1.3.20' },
    history: { label: '曾接受失禁手術、骨盆癌手術或放射治療', action: '曾接受失禁手術、骨盆癌手術或骨盆放射治療，考慮轉介專科；AUA 也提醒放射後應盡量避免網片。', src: 'NICE 1.3.20・AUA SUI 18' }
  };

  function popqStage(leading, tvl, compartment) {
    const l = Number(leading), t = Number(tvl);
    if (!Number.isFinite(l) || !Number.isFinite(t) || t < 4 || t > 14) return { stage: null, note: '請輸入合理的最遠點與陰道全長（TVL 4–14 cm）。' };
    if (compartment === 'apical' ? l <= -(t - 2) : l <= -3) return { stage: 0, note: '未見脫垂。' };
    if (l < -1) return { stage: 1, note: '最遠點位於處女膜上方超過 1 cm。' };
    if (l <= 1) return { stage: 2, note: '最遠點位於處女膜上下 1 cm 以內。' };
    if (l < t - 2) return { stage: 3, note: '最遠點超出處女膜 1 cm 以上，但未達 TVL−2 cm。' };
    return { stage: 4, note: '接近完全外翻（≥ TVL−2 cm）。' };
  }

  function step(text, src) { return { text, src }; }

  function pathway(input) {
    const d = Object.assign({ symptom: 'stress', predominant: 'unknown', pop: 'unknown', phase: 'initial', flags: [], mods: [] }, input || {});
    const flags = (d.flags || []).filter(f => FLAGS[f]);
    const mods = new Set(d.mods || []);
    const r = { tone: 'ok', type: '', title: '', summary: '', flags: flags.map(f => Object.assign({ id: f }, FLAGS[f])), assess: [], first: [], next: [], caution: [], sources: [] };

    const urinary = d.symptom !== 'prolapse' || mods.has('popUrinary');
    if (urinary) {
      r.assess.push(step('尿液試紙：血、糖、蛋白、白血球、亞硝酸鹽；有 UTI 症狀且白血球＋亞硝酸鹽陽性才送培養並先給抗生素。', 'NICE 1.3.5–1.3.9・AUA OAB 1'));
      r.assess.push(step('排尿日誌至少 3 天，涵蓋工作日與休假日；搭配經驗證的症狀／生活品質問卷。', 'NICE 1.3.12–1.3.13'));
    }
    if (flags.includes('voiding') || flags.includes('rUTI')) r.assess.push(step('測殘尿（PVR），以膀胱掃描優先。', 'NICE 1.3.10–1.3.11'));
    r.assess.push(step('不常規做墊片測試、膀胱鏡或影像（超音波僅用於殘尿）。', 'NICE 1.3.14・1.3.18–1.3.19'));

    let type = d.symptom;
    if (d.symptom === 'mixed') type = d.predominant === 'stress' ? 'mixed-stress' : d.predominant === 'urge' ? 'mixed-urge' : 'mixed-unknown';

    if (type === 'prolapse') {
      r.type = '骨盆器官脫垂';
      r.sources = ['nice', 'iuga'];
      r.assess.unshift(step('病史包含脫垂、排尿、排便與性功能；骨盆檢查排除腫塊並記錄前、中（頂端）、後腔室 POP-Q。', 'NICE 1.6.1・1.6.3'));
      r.assess.push(step('檢查與症狀不符時，改站立或蹲姿、或另擇時間重檢；脫垂已由檢查確認時不常規影像。', 'NICE 1.6.5–1.6.6'));
      if (mods.has('popUrinary')) r.assess.push(step('困擾的排尿症狀且手術為選項時，考慮進一步檢查（含尿動力學）；前腔室／頂端脫垂合併 SUI 可考慮同時手術。', 'NICE 1.6.7・1.9.1'));
      const st = d.pop;
      if (st === 'unknown') {
        r.title = '先完成骨盆檢查與 POP-Q';
        r.summary = '分期決定訓練與後續選項，也是排除骨盆腫塊的機會。';
        r.first.push(step('生活方式：BMI > 30 減重、減少提重物、預防或治療便秘。', 'NICE 1.7.2'));
      } else {
        const n = Number(st);
        r.title = `症狀性 POP-Q ${n} 期`;
        r.summary = n <= 2 ? '非手術選項優先：監督式骨盆底肌訓練與子宮托皆可討論。' : '較高期別：仍可用子宮托，手術則依症狀與偏好共同決策。';
        r.first.push(step('生活方式：BMI > 30 減重、減少提重物、預防或治療便秘。', 'NICE 1.7.2'));
        if (n <= 2) r.first.push(step('監督式骨盆底肌訓練至少 16 週作為第一選擇；有效則持續。', 'NICE 1.7.5'));
        r.first.push(step('子宮托可單用或合併骨盆底肌訓練；說明可能需多次試戴、分泌物、出血、取出困難與脫落，且至少每 6 個月取出一次。', 'NICE 1.7.6・1.7.8'));
        if (mods.has('gsm')) r.first.push(step('合併停經泌尿生殖症候群：考慮陰道雌激素；認知或肢體障礙者可考慮釋放雌激素的陰道環。', 'NICE 1.7.3–1.7.4'));
        if (mods.has('cognitive')) r.caution.push(step('認知或肢體障礙而難以自行照護子宮托者，安排每 6 個月子宮托門診。', 'NICE 1.7.9'));
        if (d.phase !== 'initial' || n >= 3) r.next.push(step('非手術治療無效或婉拒者提供手術；使用決策輔助說明復發、泌尿／腸道症狀與網片風險，並討論術後新發應力性漏尿。', 'NICE 1.8.1–1.8.2・1.8.6'));
        if (n >= 3) {
          r.tone = 'warn';
          r.caution.push(step('POP-Q ≥ 3 期且脫垂復位後仍未證實 SUI，若計畫 SUI 手術應做額外評估（潛在性 SUI）。', 'AUA SUI 2'));
        }
      }
    } else if (type === 'stress' || type === 'mixed-stress') {
      r.type = type === 'stress' ? '應力性尿失禁' : '應力主導的混合型尿失禁';
      r.title = r.type;
      r.summary = '第一線是至少 3 個月的監督式骨盆底肌訓練。';
      r.sources = ['nice', 'auaSui'];
      r.assess.push(step('開始訓練前先以指診確認骨盆底肌能收縮。', 'NICE 1.3.4'));
      r.first.push(step('監督式骨盆底肌訓練至少 3 個月，每天 3 次、每次至少 8 下收縮；有效則持續。', 'NICE 1.4.4–1.4.7'));
      r.first.push(step('無法主動收縮者可考慮電刺激或生物回饋輔助。', 'NICE 1.4.10'));
      if (mods.has('bmi')) r.first.push(step('BMI > 30：建議減重。', 'NICE 1.4.3'));
      if (type === 'mixed-stress') r.first.push(step('混合型同時提供至少 6 週膀胱訓練，治療方向以主要症狀為主。', 'NICE 1.3.1・1.4.11'));
      r.caution.push(step('Duloxetine 不作第一線；僅在偏好藥物或不適合手術時作第二線，並說明副作用。', 'NICE 1.4.35'));
      if (d.phase !== 'initial') {
        r.tone = 'warn';
        r.next.push(step('保守治療失敗、希望手術：以決策輔助共同討論 colposuspension、自體腹直肌筋膜吊帶、恥骨後中段尿道網片吊帶；其他手術不適合時才考慮尿道填充劑。', 'NICE 1.5.1–1.5.3'));
        r.next.push(step('手術前評估：病史與困擾、骨盆檢查、膀胱適度充盈下客觀證實 SUI、殘尿、尿液分析。', 'AUA SUI 1'));
        r.next.push(step('臨床已明確為單純或應力主導的 SUI：初次手術前不需常規尿動力學。合併急迫主導、類型不明、排尿功能障礙、前／頂端脫垂或曾 SUI 手術者則要做。', 'NICE 1.3.15–1.3.16・AUA SUI 5'));
        r.next.push(step('網片是永久植入物，可能無法完全移除；選擇中段尿道吊帶前須討論網片風險與替代方案。', 'NICE 1.5.7・AUA SUI 10'));
        r.caution.push(step('不提供前陰道壁修補、針式懸吊、旁陰道缺損修補、豬皮吊帶、MMK 手術治療 SUI。', 'NICE 1.5.14'));
      }
    } else if (type === 'mixed-unknown') {
      r.type = '混合型尿失禁（主導症狀未明）';
      r.title = '先釐清哪一種漏尿最困擾';
      r.summary = 'NICE：混合型依主要症狀決定治療方向。';
      r.tone = 'warn';
      r.sources = ['nice'];
      r.assess.push(step('用排尿日誌分別記錄腹壓漏尿與急迫漏尿次數及困擾程度。', 'NICE 1.3.1・1.3.13'));
      r.first.push(step('等待釐清期間，可同時提供至少 3 個月監督式骨盆底肌訓練與至少 6 週膀胱訓練。', 'NICE 1.4.4・1.4.11'));
      r.caution.push(step('類型不明時，SUI 手術前需做尿動力學；術前須說明急迫症狀可能持續或惡化。', 'NICE 1.3.2・1.3.16'));
    } else {
      r.type = type === 'urge' ? '急迫性尿失禁／OAB' : '急迫主導的混合型尿失禁';
      r.title = r.type;
      r.summary = '膀胱訓練與行為治療先行，藥物與微創治療共同決策。';
      r.sources = ['nice', 'auaOab'];
      r.assess.push(step('評估可能造成頻尿、尿急的共病與藥物，並說明處理它們對症狀的影響。', 'AUA OAB 7'));
      r.assess.push(step('有排空症狀時可測殘尿；初始評估不常規做尿動力學、膀胱鏡或影像。', 'AUA OAB 3・5'));
      r.first.push(step('膀胱訓練至少 6 週；減少咖啡因、調整過多或過少的液體攝取。', 'NICE 1.4.1–1.4.2・1.4.11・AUA OAB 11–12'));
      if (mods.has('bmi')) r.first.push(step('BMI > 30：建議減重。', 'NICE 1.4.3'));
      if (type === 'mixed-urge') r.first.push(step('兼顧應力成分：同時提供至少 3 個月監督式骨盆底肌訓練；若日後考慮 SUI 手術，需先做尿動力學。', 'NICE 1.4.4・1.3.16'));
      r.first.push(step('與病人討論尿墊等失禁處理用品；但不以吸收產品作為「治療」。', 'AUA OAB 10・NICE 1.4.16'));
      if (mods.has('gsm')) r.first.push(step('合併停經泌尿生殖症候群：提供陰道雌激素；不用全身性 HRT 治療尿失禁。', 'NICE 1.4.36–1.4.37'));
      if (d.phase !== 'initial') {
        r.next.push(step('藥物：抗膽鹼藥或 β3 促效劑皆為選項（AUA）；NICE 以抗膽鹼藥為先、β3 促效劑於抗膽鹼藥不適合、無效或副作用時（TA290／TA999）。', 'AUA OAB 16・NICE 1.4.30–1.4.32'));
        r.next.push(step('開始用藥 4 週回顧；單一藥物效果不足可換藥或跨類別合併。', 'NICE 1.4.38・AUA OAB 21–22'));
        r.caution.push(step('抗膽鹼藥：說明認知障礙與失智風險，計算總抗膽鹼負擔；窄角青光眼、胃排空障礙、尿滯留病史須極度小心；年長且可能突然惡化者避免速效 oxybutynin。', 'AUA OAB 18–19・NICE 1.4.26・1.4.29'));
      }
      if (d.phase === 'medication') {
        r.tone = 'warn';
        r.next.push(step('AUA：藥物或行為治療反應不足或無法耐受，應提供薦神經調控、經皮脛神經刺激（PTNS）及／或膀胱內肉毒桿菌素；病人也可在共同決策下不先試藥直接選擇。', 'AUA OAB 24–25'));
        r.next.push(step('NICE：藥物無效轉二級照護，經 MDT 評估；尿動力學確認逼尿肌過動後提供肉毒桿菌素 100 U，12 週內回顧。PTNS 僅在 MDT 討論後且不願肉毒或薦神經刺激時。', 'NICE 1.4.15・1.4.40・1.4.43–1.4.49'));
        r.next.push(step('肉毒桿菌素前測殘尿，且病人須願意在明顯排尿障礙時規律自我導尿（或接受暫時留置導尿管）。', 'AUA OAB 26・NICE 1.4.47'));
        r.caution.push(step('NICE 不提供經皮膚表面的薦神經或脛神經刺激（transcutaneous）。', 'NICE 1.4.13–1.4.14'));
      }
      if (mods.has('cognitive')) r.caution.push(step('已診斷失智者若考慮抗膽鹼藥，依 NICE 失智指引處理可能造成認知障礙的藥物；β3 促效劑通常可優先討論。', 'NICE 1.4.27・AUA OAB 18'));
      if (mods.has('nocturia')) r.caution.push(step('夜尿困擾可考慮 desmopressin；囊性纖維化者小心，> 65 歲合併心血管疾病或高血壓者避免。', 'NICE 1.4.34'));
      if (mods.has('over75')) r.caution.push(step('長期 OAB 用藥每 12 個月回顧，> 75 歲每 6 個月。', 'NICE 1.4.42'));
    }

    if (flags.length) {
      r.tone = 'alert';
      r.summary = '先處理警訊；以下路徑僅在排除複雜病因後適用。';
    }
    r.sources = r.sources.map(k => Object.assign({ id: k }, SRC[k]));
    return r;
  }

  root.PF = { SRC, FLAGS, pathway, popqStage };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PF;
})(typeof window !== 'undefined' ? window : globalThis);
/*ENGINE-END*/

/*TEACH-START*/
(function (root) {
  'use strict';
  // each stage: situation, question, worked steps [text, source], pathway preset to load (expect = regex the engine output must match, checked in tests.cjs)
  const FULL = [
    {
      id: 'sui', cls: 'c-stress', tag: '應力性 → 手術決策', title: '想手術的跑者：術前要不要做尿動力學？',
      who: '47 歲，自然產 2 次，慢跑及咳嗽時漏尿 3 年，每天 2 片護墊，想恢復跑步。',
      data: ['BMI 27', '無尿急、血尿、反覆 UTI', '試紙陰性', '3 天日誌：漏尿皆與腹壓有關，無急迫漏尿', '指診可收縮骨盆底肌'],
      stages: [
        {
          label: '初診', q: '她問能不能直接排手術。下一步？',
          steps: [
            ['歸類為應力性尿失禁；開始前已指診確認能收縮骨盆底肌。', 'NICE 1.3.1・1.3.4'],
            ['第一線：監督式骨盆底肌訓練至少 3 個月，每天 3 次、每次至少 8 下。', 'NICE 1.4.4–1.4.5'],
            ['這階段也不需要墊片測試、膀胱鏡或影像。AUA 同時要求說明觀察、訓練、其他非手術與手術等選項。', 'NICE 1.3.14・1.3.18–1.3.19・AUA SUI 8']
          ],
          preset: { symptom: 'stress', phase: 'initial', flags: [], mods: [] }, expect: '至少 3 個月'
        },
        {
          label: '訓練 4 個月後', q: '已照表訓練但仍影響運動，希望手術。膀胱適度充盈時咳嗽可見漏尿，殘尿 30 mL（虛構數值），尿液分析正常，無脫垂。要做尿動力學嗎？',
          steps: [
            ['術前評估五項已齊：病史與困擾、骨盆檢查、客觀證實 SUI、殘尿、尿液分析。', 'AUA SUI 1'],
            ['不做：明確 SUI 且已檢查證實，NICE 明定初次手術前不做多頻道尿動力學；AUA 為可省略。', 'NICE 1.3.15・AUA SUI 5'],
            ['也沒有 NICE 列出要做的四種情況：急迫主導或類型不明、排尿功能障礙、前／頂端脫垂、曾接受 SUI 手術。', 'NICE 1.3.16'],
            ['沒有泌尿道異常疑慮，不做膀胱鏡。', 'AUA SUI 4']
          ],
          preset: { symptom: 'stress', phase: 'conservative', flags: [], mods: [] }, expect: '不需常規尿動力學'
        },
        {
          label: '選術式', q: '她問「吊帶」是什麼，也擔心網片。怎麼談？',
          steps: [
            ['NICE 的選項：colposuspension、自體腹直肌筋膜吊帶，以及恥骨後中段尿道網片吊帶；須用決策輔助，並談當地沒有的術式。', 'NICE 1.5.1–1.5.2'],
            ['指引差異：AUA 可提供恥骨後、經閉孔或單切口吊帶；NICE 除特定情況不用經閉孔，單切口僅限臨床試驗。', 'AUA SUI 12–13・NICE 1.5.10–1.5.11'],
            ['選網片前必須說明特定風險與替代方案：永久植入物、可能無法完全移除；並給書面植入資料。', 'AUA SUI 10・NICE 1.5.7–1.5.8'],
            ['台灣可用術式與網片規範須另行核對，不可直接套用英國政策。', '本頁教學界線']
          ]
        },
        {
          label: '術後', q: '接受恥骨後中段尿道吊帶。追蹤什麼？',
          steps: [
            ['術後早期聯繫，了解排尿困難、疼痛或其他意外狀況；有問題就回診檢查。', 'AUA SUI 23'],
            ['6 個月內回診：殘餘漏尿、排尿與尿流、UTI、疼痛、性功能、新發或惡化的 OAB，並測殘尿。', 'AUA SUI 24・NICE 1.5.15'],
            ['陰道檢查確認網片有無外露或穿出。', 'NICE 1.5.16・AUA SUI 24'],
            ['手術失敗或症狀復發：尋求處理複雜骨盆底功能障礙的區域 MDT 意見；不想再手術則給症狀處理建議。', 'NICE 1.5.18']
          ]
        }
      ]
    },
    {
      id: 'oab', cls: 'c-urge', tag: '難治 OAB → 高齡用藥', title: '記憶變差的阿嬤：藥物之後怎麼走？',
      who: '77 歲，尿急、頻尿、來不及就漏，已不太敢出門。高血壓控制穩定，便秘，自覺近年記性變差，每天 3 杯咖啡。',
      data: ['日誌：白天 11 次、夜尿 2 次、急迫漏尿每天 3 次', '試紙陰性', '無血尿、神經學異常', '殘尿 40 mL（虛構數值）', '手部關節炎'],
      stages: [
        {
          label: '初診', q: '先做什麼？夜尿能開 desmopressin 嗎？',
          steps: [
            ['評估共病與藥物對頻尿、尿急的影響，並說明處理後可能改善。', 'AUA OAB 7'],
            ['膀胱訓練至少 6 週、減少咖啡因、調整液體；討論護墊等處理用品，但它不是治療。', 'NICE 1.4.1–1.4.2・1.4.11・AUA OAB 10–12・NICE 1.4.16'],
            ['Desmopressin 應避免：> 65 歲合併高血壓。', 'NICE 1.4.34'],
            ['初始評估不常規做尿動力學、膀胱鏡或影像。', 'AUA OAB 5']
          ],
          preset: { symptom: 'urge', phase: 'initial', flags: [], mods: ['nocturia', 'cognitive', 'over75'] }, expect: 'desmopressin'
        },
        {
          label: '訓練 8 週後', q: '漏尿略減仍困擾，同意用藥。怎麼選？',
          steps: [
            ['抗膽鹼藥要先談失智與認知風險，並算總抗膽鹼負擔；她的認知疑慮與便秘都要納入。', 'AUA OAB 18・NICE 1.4.26'],
            ['指引差異：AUA 兩類皆可、依副作用共同決策；NICE 先用最低價抗膽鹼藥，抗膽鹼藥不適合時才用 β3 促效劑。此例兩邊都支持選 β3 促效劑。', 'AUA OAB 16–17・NICE 1.4.30・1.4.32'],
            ['若仍用抗膽鹼藥，避免速效 oxybutynin（年長且可能突然惡化者）。', 'NICE 1.4.29'],
            ['開始後 4 週回顧；長期用藥每 6 個月回顧（> 75 歲）。血壓監測依藥品仿單。', 'NICE 1.4.38・1.4.42']
          ],
          preset: { symptom: 'urge', phase: 'conservative', flags: [], mods: ['cognitive', 'over75'] }, expect: '4 週'
        },
        {
          label: '藥物效果不足', q: '換藥、合併後仍每天漏尿。下一步與兩份指引的差別？',
          steps: [
            ['AUA 應提供薦神經調控、PTNS 及／或膀胱內肉毒桿菌素；NICE 則先轉二級照護。', 'AUA OAB 25・NICE 1.4.40'],
            ['NICE 路徑：做尿動力學確認逼尿肌過動，再經 MDT 提供肉毒。AUA 只列為可做，不是前提。', 'NICE 1.4.43–1.4.44・AUA OAB 29'],
            ['關鍵問題：手部關節炎與記憶問題下，能自我導尿嗎？不願或不能規律導尿，也不接受暫時留置，就不開始肉毒。', 'NICE 1.4.46–1.4.47'],
            ['不接受導尿風險時，NICE 改提供經皮薦神經刺激；PTNS 僅在 MDT 後且兩者都不要時。皮膚表面電刺激不提供。', 'NICE 1.4.52・1.4.15・1.4.13–1.4.14']
          ],
          preset: { symptom: 'urge', phase: 'medication', flags: [], mods: ['cognitive', 'over75'] }, expect: '100 U'
        },
        {
          label: '接受肉毒之後', q: '她接受必要時暫時留置導尿，注射肉毒。如何追蹤？',
          steps: [
            ['注射前測殘尿；NICE 起始劑量 100 U。', 'AUA OAB 26・NICE 1.4.48'],
            ['12 週內回顧。緩解不足可考慮之後增至 200 U；症狀未改善或惡化要再測殘尿。', 'NICE 1.4.49・AUA OAB 27'],
            ['緩解足夠但不到 6 個月，也可考慮之後增至 200 U。', 'NICE 1.4.50'],
            ['反應好就停口服藥，效果不再時才重啟。', 'AUA OAB 28']
          ]
        }
      ]
    },
    {
      id: 'pop', cls: 'c-pop', tag: '脫垂 → 術式與潛在漏尿', title: '子宮托掉了兩次：手術要不要順便做吊帶？',
      who: '68 歲，自然產 3 次，陰道膨出感與下墜感 1 年，久站加重，偶有排不乾淨感。自述沒有漏尿。',
      data: ['最遠點 Ba +2 cm（前腔室）', 'C −3、Bp −2、TVL 9 cm（虛構數值）', '陰道乾澀', '未摸到骨盆腫塊', '殘尿 60 mL（虛構數值）'],
      popq: { comp: 'anterior', lead: 2, tvl: 9, stage: 3 },
      stages: [
        {
          label: '初診', q: '先算 POP-Q，然後有哪些非手術選項？骨盆底肌訓練還是第一選擇嗎？',
          steps: [
            ['最遠點 +2：超出處女膜 1 cm 以上，且未達 TVL−2（7 cm），為 POP-Q 3 期。分期取最遠點，不是每個腔室各算。', 'NICE 1.6.3・IUGA'],
            ['骨盆檢查同時排除腫塊，也評估肌肉活動與陰道萎縮；已由檢查確認，不需影像。', 'NICE 1.6.1・1.6.3・1.6.5'],
            ['至少 16 週訓練是 1–2 期的第一選擇，3 期不適用此建議。子宮托不限期別，可單用或合併訓練。', 'NICE 1.7.5–1.7.6'],
            ['生活方式建議；陰道乾澀考慮陰道雌激素。子宮托前說明多次試戴、分泌物、出血、取出困難、脫落，至少每 6 個月取出。', 'NICE 1.7.2–1.7.3・1.7.8']
          ],
          preset: { symptom: 'prolapse', pop: '3', phase: 'initial', flags: [], mods: ['gsm', 'popUrinary'] }, expect: '子宮托'
        },
        {
          label: '子宮托失敗', q: '試戴兩種都脫落，她希望手術。怎麼談？',
          steps: [
            ['非手術無效或婉拒者提供手術；用決策輔助，談繼續非手術、復發、泌尿／腸道／性功能變化與網片不確定性。', 'NICE 1.8.1–1.8.2'],
            ['有子宮脫垂成分時，依是否保留子宮討論陰道子宮切除、薦棘韌帶固定、Manchester 等選項；用網片要說明材質與永久性。', 'NICE 1.8.8–1.8.11・1.8.6'],
            ['困擾的排尿症狀且手術為選項時，考慮進一步檢查。', 'NICE 1.6.7']
          ],
          preset: { symptom: 'prolapse', pop: '3', phase: 'conservative', flags: [], mods: ['popUrinary'] }, expect: '手術'
        },
        {
          label: '要不要加吊帶？', q: '復位脫垂後做咳嗽測試，沒有漏尿。她問：要不要順便做吊帶預防？',
          steps: [
            ['NICE：沒有尿失禁者，不為預防而做失禁手術；但須告知前／頂端脫垂術後可能新發漏尿，可能需後續治療。', 'NICE 1.8.3–1.8.4'],
            ['AUA 把這個情境列為須額外評估：POP-Q ≥ 3 期且復位後未證實 SUI。', 'AUA SUI 2'],
            ['指引差異：AUA 討論全做、全不做、選擇性三種做法，並引用 OPUS：加吊帶 12 個月 SUI 27.3% vs 43.0%，NNT 6.3。提醒要權衡不必要手術與併發症。', 'AUA SUI 19 討論'],
            ['若復位後確實漏尿、考慮同時手術：NICE 要求術前尿動力學，並說明合併手術超過 1 年的效果仍不確定。', 'NICE 1.9.1–1.9.2・1.3.16']
          ],
          preset: { symptom: 'prolapse', pop: '3', phase: 'conservative', flags: [], mods: ['popUrinary'] }, expect: '潛在性 SUI'
        }
      ]
    }
  ];

  // branches of the mind map; each leaf = [text, source]
  const MAP = [
    {
      id: 'assess', cls: 'm-assess', title: '共同評估', groups: [
        { t: '分型', items: [['應力、混合、急迫／OAB；混合型依主要症狀', 'NICE 1.3.1']] },
        { t: '都要做', items: [['尿液試紙', 'NICE 1.3.5'], ['排尿日誌 ≥ 3 天，含工作與休假日', 'NICE 1.3.13']] },
        { t: '有指徵才做', items: [['殘尿：排尿困難或反覆 UTI，膀胱掃描優先', 'NICE 1.3.10–1.3.11'], ['SUI 術前尿動力學：急迫主導或類型不明、排尿障礙、前／頂端脫垂、曾 SUI 手術', 'NICE 1.3.16']] },
        { t: '不常規', items: [['墊片測試、膀胱鏡、影像', 'NICE 1.3.14・1.3.18–1.3.19']] }
      ]
    },
    {
      id: 'flag', cls: 'm-flag', title: '警訊與轉介', groups: [
        { t: '可疑癌症路徑', items: [['血尿；反覆或持續不明原因 UTI', 'NICE 1.3.21'], ['骨盆腫塊：卵巢癌、膀胱癌路徑', 'NICE 1.6.1']] },
        { t: '考慮專科', items: [['持續膀胱／尿道疼痛、解尿後可觸及膀胱', 'NICE 1.3.20'], ['疑神經疾病、瘻管、排尿困難、合併大便失禁', 'NICE 1.3.20'], ['曾失禁手術、骨盆癌手術、骨盆放療', 'NICE 1.3.20']] }
      ]
    },
    {
      id: 'sui', cls: 'm-stress', title: '應力性尿失禁', groups: [
        { t: '第一線', items: [['監督式骨盆底肌訓練 ≥ 3 個月，每天 3 次、每次 ≥ 8 下', 'NICE 1.4.4–1.4.5'], ['BMI > 30 減重', 'NICE 1.4.3'], ['Duloxetine 不作第一線', 'NICE 1.4.35']] },
        { t: '手術前', items: [['病史、骨盆檢查、客觀證實 SUI、殘尿、尿液分析', 'AUA SUI 1'], ['明確 SUI 初次手術不做尿動力學', 'NICE 1.3.15・AUA SUI 5']] },
        { t: '手術', items: [['Colposuspension、自體筋膜吊帶、恥骨後網片吊帶', 'NICE 1.5.2'], ['網片：永久植入，須說明風險與替代', 'NICE 1.5.7・AUA SUI 10'], ['其他術式不適合才用填充劑', 'NICE 1.5.3'], ['不做前陰道壁修補、MMK 等', 'NICE 1.5.14']] },
        { t: '術後', items: [['6 個月內回診；網片者做陰道檢查', 'NICE 1.5.15–1.5.16・AUA SUI 24']] }
      ]
    },
    {
      id: 'oab', cls: 'm-urge', title: '急迫性／OAB', groups: [
        { t: '第一線', items: [['膀胱訓練 ≥ 6 週', 'NICE 1.4.11'], ['減少咖啡因、調整液體', 'NICE 1.4.1–1.4.2'], ['評估共病與藥物', 'AUA OAB 7']] },
        { t: '藥物', items: [['AUA：抗膽鹼藥或 β3 皆可；NICE：抗膽鹼藥先', 'AUA OAB 16・NICE 1.4.30・1.4.32'], ['抗膽鹼：談失智風險、算總負擔', 'AUA OAB 18・NICE 1.4.26'], ['4 週回顧；長期每 12 個月，> 75 歲每 6 個月', 'NICE 1.4.38・1.4.42'], ['夜尿 desmopressin：> 65 歲合併心血管病或高血壓避免', 'NICE 1.4.34']] },
        { t: '藥物無效', items: [['肉毒 100 U，12 週內回顧；先測殘尿，須願意導尿', 'NICE 1.4.47–1.4.49・AUA OAB 26'], ['薦神經刺激：肉毒無效或不接受導尿風險', 'NICE 1.4.52'], ['PTNS：NICE 限 MDT 後；AUA 與其他並列', 'NICE 1.4.15・AUA OAB 25'], ['NICE 先做尿動力學與 MDT', 'NICE 1.4.43–1.4.44']] },
        { t: '最後手段', items: [['膀胱擴大整形、尿路改道', 'NICE 1.4.55–1.4.56・AUA OAB 30']] }
      ]
    },
    {
      id: 'pop', cls: 'm-pop', title: '骨盆器官脫垂', groups: [
        { t: '評估', items: [['POP-Q 記錄前、中、後腔室；排除腫塊', 'NICE 1.6.1・1.6.3'], ['已由檢查確認不需影像', 'NICE 1.6.5'], ['症狀與檢查不符：站立、蹲姿或改日重檢', 'NICE 1.6.6']] },
        { t: '非手術', items: [['減重、少提重物、治便秘', 'NICE 1.7.2'], ['1–2 期：監督式訓練 ≥ 16 週', 'NICE 1.7.5'], ['子宮托：至少每 6 個月取出', 'NICE 1.7.6・1.7.8'], ['泌尿生殖症狀：陰道雌激素', 'NICE 1.7.3']] },
        { t: '手術', items: [['非手術無效或婉拒者提供，用決策輔助', 'NICE 1.8.1–1.8.2'], ['用網片須說明材質與永久性', 'NICE 1.8.6']] },
        { t: '與 SUI 的關係', items: [['無漏尿：不為預防做失禁手術，但告知術後風險', 'NICE 1.8.3–1.8.4'], ['≥ 3 期且復位後未證實 SUI：額外評估', 'AUA SUI 2'], ['合併 SUI：考慮同時手術，超過 1 年效果不確定', 'NICE 1.9.1–1.9.2']] }
      ]
    }
  ];

  root.PF.FULL = FULL;
  root.PF.MAP = MAP;
})(typeof window !== 'undefined' ? window : globalThis);
/*TEACH-END*/

(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- theme ---------- */
  const themeBtn = $('#theme');
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
    themeBtn.textContent = t === 'dark' ? '☀︎ 淺色' : '☾ 深色';
    try { localStorage.setItem('pf-theme', t); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem('pf-theme'); } catch (e) {}
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  /* ---------- pathway ---------- */
  const form = $('#decision');
  const PRESETS = {
    runner: { symptom: 'stress', phase: 'initial', flags: [], mods: ['bmi'] },
    urge: { symptom: 'urge', phase: 'medication', flags: [], mods: ['cognitive', 'over75'] },
    mixed: { symptom: 'mixed', predominant: 'unknown', phase: 'initial', flags: [], mods: [] },
    pop: { symptom: 'prolapse', pop: '2', phase: 'initial', flags: [], mods: ['gsm'] },
    flag: { symptom: 'urge', phase: 'initial', flags: ['haematuria', 'voiding'], mods: [] }
  };
  function read() {
    const fd = new FormData(form);
    return { symptom: fd.get('symptom'), predominant: fd.get('predominant'), pop: fd.get('pop'), phase: fd.get('phase'), flags: fd.getAll('flag'), mods: fd.getAll('mod') };
  }
  function write(p) {
    form.querySelectorAll('input[type=radio]').forEach(i => { i.checked = (p[i.name] || (i.name === 'predominant' ? 'unknown' : i.name === 'pop' ? 'unknown' : '')) === i.value; });
    form.querySelectorAll('input[name=flag]').forEach(i => { i.checked = p.flags.includes(i.value); });
    form.querySelectorAll('input[name=mod]').forEach(i => { i.checked = p.mods.includes(i.value); });
  }
  function sync() {
    const d = read();
    $('#predominant-field').hidden = d.symptom !== 'mixed';
    $('#pop-field').hidden = d.symptom !== 'prolapse';
    $('#phase-med').hidden = d.symptom === 'prolapse' || d.symptom === 'stress' || (d.symptom === 'mixed' && d.predominant !== 'urge');
    if ($('#phase-med').hidden && d.phase === 'medication') form.querySelector('input[name=phase][value=conservative]').checked = true;
    $$('[data-only]').forEach(el => { el.hidden = !el.dataset.only.split(' ').includes(d.symptom); });
    render(PF.pathway(read()));
  }
  const list = (items, cls) => items.length ? `<ol class="steps ${cls || ''}">${items.map(s => `<li><span>${esc(s.text)}</span><cite>${esc(s.src)}</cite></li>`).join('')}</ol>` : '';
  function render(r) {
    const tone = { ok: '可先由初級照護處理', warn: '共同決策／考慮專科', alert: '先處理警訊' }[r.tone];
    $('#result').className = 'result tone-' + r.tone;
    $('#result').innerHTML = `
      <div class="result-head"><span class="pill">${tone}</span><span class="type">${esc(r.type)}</span></div>
      <h3>${esc(r.title)}</h3><p class="summary">${esc(r.summary)}</p>
      ${r.flags.length ? `<div class="block flagbox"><h4>⚠ 警訊處理</h4><ol class="steps">${r.flags.map(f => `<li><span><b>${esc(f.label)}：</b>${esc(f.action)}</span><cite>${esc(f.src)}</cite></li>`).join('')}</ol></div>` : ''}
      <div class="block"><h4>評估</h4>${list(r.assess)}</div>
      ${r.first.length ? `<div class="block"><h4>第一線</h4>${list(r.first)}</div>` : ''}
      ${r.next.length ? `<div class="block"><h4>進階／轉介</h4>${list(r.next)}</div>` : ''}
      ${r.caution.length ? `<div class="block caution"><h4>注意</h4>${list(r.caution)}</div>` : ''}
      <p class="src-links">${r.sources.map(s => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}</p>`;
  }
  form.addEventListener('change', sync);
  form.addEventListener('submit', e => e.preventDefault());
  $$('[data-preset]').forEach(b => b.addEventListener('click', () => {
    write(PRESETS[b.dataset.preset]);
    $$('[data-preset]').forEach(x => x.classList.toggle('active', x === b));
    sync();
    if (matchMedia('(max-width: 900px)').matches) $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  $('#clear').addEventListener('click', () => { write({ symptom: 'stress', phase: 'initial', flags: [], mods: [] }); $$('[data-preset]').forEach(x => x.classList.remove('active')); sync(); });
  sync();

  /* ---------- POP-Q ---------- */
  const pq = { lead: $('#pq-lead'), tvl: $('#pq-tvl'), comp: $('#pq-comp') };
  function drawPopq() {
    const l = Number(pq.lead.value), t = Number(pq.tvl.value), comp = pq.comp.value;
    $('#pq-lead-out').textContent = (l > 0 ? '+' : '') + l + ' cm';
    const r = PF.popqStage(l, t, comp);
    $('#pq-stage').textContent = r.stage === null ? '—' : r.stage;
    $('#pq-note').textContent = r.note;
    $('#pq-apply').disabled = !(r.stage >= 1);
    $('#pq-apply').dataset.stage = r.stage;
    // y axis: hymen at y=150; 1 cm = 14 px; negative = inside (up), positive = outside (down)
    const y = 150 + l * 14;
    $('#pq-dot').setAttribute('cy', Math.max(10, Math.min(290, y)));
    const top = Math.min(y, 150) - 40;
    $('#pq-bulge').setAttribute('d', `M120 ${top} Q150 ${2 * y - top} 180 ${top}`);
    $$('.pq-band').forEach(b => b.classList.toggle('on', r.stage !== null && Number(b.dataset.stage) === Math.min(Math.max(r.stage, 1), 3)));
  }
  Object.values(pq).forEach(el => el.addEventListener('input', drawPopq));
  $('#pq-apply').addEventListener('click', () => {
    const st = $('#pq-apply').dataset.stage;
    write({ symptom: 'prolapse', pop: st, phase: 'initial', flags: [], mods: [] });
    sync();
    $('#pathway').scrollIntoView({ behavior: 'smooth' });
  });
  drawPopq();

  /* ---------- cases & quiz ---------- */
  const cases = [
    ['跑步時漏尿', '42 歲，跑跳及咳嗽時漏尿，無尿急、血尿或感染。', ['尿液試紙、確認骨盆底肌收縮，開始至少 3 個月監督式訓練', '直接診斷膀胱過動症並開藥', '未評估就安排手術'], '應力性尿失禁第一線是監督式骨盆底肌訓練至少 3 個月；開始前先以指診確認能收縮（NICE 1.3.4、1.4.4）。'],
    ['夜尿與尿急', '66 歲突然尿急、頻尿與來不及就漏，尿液試紙無感染線索。', ['3 天排尿日誌，膀胱訓練至少 6 週並減少咖啡因', '只因夜尿即做脫垂手術', '不需詢問用藥與液體攝取'], 'OAB 以尿急為核心；NICE 建議至少 6 週膀胱訓練與減少咖啡因，AUA 建議評估共病與藥物。'],
    ['混合型尿失禁', '54 歲，咳嗽會漏，也常急迫漏尿，急迫症狀最困擾。', ['依主要症狀（急迫）導向治療，並兼顧骨盆底肌訓練', '直接認定單一機轉', '只做應力性手術就可治所有尿急'], 'NICE 1.3.1：混合型治療以主要症狀為導向；若日後考慮 SUI 手術，急迫主導者術前需尿動力學。'],
    ['藥物與認知風險', '78 歲 OAB，膀胱訓練後仍困擾，憂慮記憶變差及便秘。', ['討論失智風險與抗膽鹼負擔，考慮 β3 促效劑並核對血壓', '不問風險直接長期高劑量抗膽鹼藥', '只依年齡拒絕所有治療'], 'AUA OAB 18：須討論抗膽鹼藥的失智與認知風險；NICE 1.4.26 要求考量總抗膽鹼負擔。> 75 歲長期用藥每 6 個月回顧。'],
    ['脫垂與膨出', '69 歲有陰道膨出感，POP-Q 2 期，偏好非手術治療。', ['討論至少 16 週監督式骨盆底肌訓練與子宮托', '無症狀也必須手術', '只看影像，不做骨盆檢查'], 'NICE 1.7.5–1.7.6：症狀性 1–2 期先考慮至少 16 週訓練；子宮托可單用或合併訓練。'],
    ['血尿與排空障礙', '73 歲漏尿、肉眼血尿與排尿不全。', ['依可疑泌尿道癌症路徑評估血尿並測殘尿', '直接按單純 OAB 開抗膽鹼藥', '只發給護墊不評估'], '血尿依 NICE NG12 轉介（NG123 1.3.21）；排尿困難測殘尿並屬轉介指標；抗膽鹼藥對滯留病史須極度小心。']
  ];
  // [question, options (first = correct), explanation, source, advanced]
  const quiz = [
    ['OAB 的核心症狀？', ['尿急', '咳嗽時漏尿', '陰道膨出'], 'OAB 核心是尿急，常伴頻尿與夜尿，可有急迫性漏尿。', 'AUA OAB', false],
    ['NICE 對所有女性尿失禁的初步尿液檢查？', ['尿液試紙', '每人先做膀胱鏡', '不需要檢查'], '尿液試紙偵測血、糖、蛋白、白血球與亞硝酸鹽；初始評估不用膀胱鏡。', 'NICE 1.3.5・1.3.18', false],
    ['應力性或混合型尿失禁第一線監督式骨盆底肌訓練至少多久？', ['3 個月', '3 天', '1 年'], '至少 3 個月，每天 3 次、每次至少 8 下收縮。', 'NICE 1.4.4–1.4.5', false],
    ['急迫性或混合型尿失禁的膀胱訓練至少多久？', ['6 週', '3 天', '6 個月'], 'NICE 建議至少 6 週膀胱訓練作為第一線。', 'NICE 1.4.11', false],
    ['NICE 建議的排尿日誌至少記錄幾天？', ['3 天，涵蓋工作日與休假日', '1 天即可', '14 天'], '至少 3 天，並涵蓋日常活動的變化。', 'NICE 1.3.13', false],
    ['長期處方抗膽鹼藥須與病人討論？', ['失智與認知障礙風險', '皮膚顏色改變', '不需討論'], 'AUA 要求討論失智與認知風險；NICE 要考量總抗膽鹼負擔。', 'AUA OAB 18・NICE 1.4.26', false],
    ['女性應力性尿失禁術前評估應包括？', ['客觀證實漏尿、殘尿、尿液分析與骨盆檢查', '只看 CA-125', '只做胸部 X 光'], 'AUA SUI 1 列出病史與困擾、骨盆檢查、客觀證實 SUI、PVR、尿液分析。', 'AUA SUI 1', false],
    ['POP-Q 主要用於？', ['記錄前、中、後腔室脫垂的位置與程度', '量測血糖', '診斷腎結石'], 'NICE 1.6.3：以 POP-Q 記錄各腔室脫垂程度。', 'NICE 1.6.3', false],
    ['症狀性 POP-Q 1–2 期的第一選擇？', ['至少 16 週監督式骨盆底肌訓練', '直接手術', '不問病人意願'], 'NICE 1.7.5：至少 16 週訓練為第一選擇，有效則持續。', 'NICE 1.7.5', false],
    ['子宮托治療開始前應說明？', ['可能需多次試戴、出血與分泌物、至少每 6 個月取出', '永遠不需追蹤', '只能給無症狀患者'], 'NICE 1.7.8 列出試戴、性生活影響、併發症與至少每 6 個月取出。', 'NICE 1.7.8', false],

    ['48 歲，臨床病史與檢查已明確為單純 SUI 並證實漏尿，計畫初次中段尿道吊帶。尿動力學？', ['不需常規執行', '必須做多頻道膀胱容積壓力圖', '必須先做膀胱鏡'], 'NICE 1.3.15：明確單純或應力主導 SUI 初次手術前不做多頻道尿動力學；AUA SUI 5：index patient 可省略。', 'NICE 1.3.15・AUA SUI 5', true],
    ['依 NICE，下列哪一種情況在 SUI 手術前「應」做尿動力學？', ['合併前腔室或頂端脫垂', '35 歲、首次手術、明確單純 SUI', 'BMI 28'], 'NICE 1.3.16：急迫主導或類型不明、排尿功能障礙、前／頂端脫垂、曾接受 SUI 手術者，術前應做尿動力學。', 'NICE 1.3.16', true],
    ['OAB 考慮膀胱內肉毒桿菌素，開始前必要條件？', ['測殘尿，且病人願意在必要時自我導尿', '先試過三種抗膽鹼藥', '只要病人年齡 > 65'], 'AUA OAB 26 要求注射前測 PVR；NICE 1.4.47 只在病人願意規律自我導尿（或接受暫時留置）時才開始。NICE 起始劑量 100 U、12 週內回顧。', 'AUA OAB 26・NICE 1.4.47–1.4.49', true],
    ['關於脛神經刺激，何者正確？', ['NICE 不提供經皮膚表面（transcutaneous）刺激；AUA 將經皮針刺 PTNS 列為藥物失敗後選項', 'NICE 與 AUA 都把 PTNS 列為第一線', '兩份指引都完全禁止 PTNS'], 'NICE 1.4.14–1.4.15：不提供 transcutaneous PTNS；percutaneous PTNS 僅在 MDT、藥物無效且不願肉毒或薦神經刺激時。AUA OAB 25 則與 SNM、肉毒並列。', 'NICE 1.4.14–1.4.15・AUA OAB 25', true],
    ['70 歲、高血壓，夜尿困擾，考慮 desmopressin？', ['應避免', '首選且不需監測', '只要囊性纖維化就首選'], 'NICE 1.4.34：可考慮用於困擾的夜尿，但 > 65 歲合併心血管疾病或高血壓者避免，囊性纖維化者須特別小心。', 'NICE 1.4.34', true],
    ['80 歲長期服用 OAB 藥物，NICE 建議多久在初級照護回顧一次？', ['每 6 個月', '每 12 個月', '不需回顧'], 'NICE 1.4.42：每 12 個月，> 75 歲每 6 個月；新藥開始後 4 週回顧（1.4.38）。', 'NICE 1.4.42', true],
    ['應力主導尿失禁，病人偏好藥物而非手術。Duloxetine 的定位？', ['可作第二線並說明副作用，但不作第一線', '第一線首選', '任何情況都不可使用'], 'NICE 1.4.35：不作第一線；不常規作第二線，但偏好藥物或不適合手術時可提供。', 'NICE 1.4.35', true],
    ['停經後 OAB 合併陰道萎縮症狀，荷爾蒙治療的建議？', ['提供陰道雌激素；不以全身性 HRT 治療尿失禁', '提供全身性 HRT 治療尿失禁', '雌激素一律禁止'], 'NICE 1.4.36–1.4.37。', 'NICE 1.4.36–1.4.37', true],
    ['下列哪一項 NICE 明確「不提供」作為 SUI 手術？', ['前陰道壁修補（anterior colporrhaphy）', 'Colposuspension', '自體腹直肌筋膜吊帶'], 'NICE 1.5.14 不提供前陰道壁修補、針式懸吊、旁陰道缺損修補、豬皮吊帶與 MMK。另 AUA SUI 14：術中意外傷及尿道時不放網片。', 'NICE 1.5.14・AUA SUI 14', true],
    ['前腔室 POP-Q 3 期，脫垂復位後仍未證實 SUI，計畫脫垂手術。依 AUA SUI 2023？', ['若考慮 SUI 手術，先做額外評估', '一律同時放中段尿道吊帶', '脫垂手術後必定不會漏尿'], 'AUA SUI 2：POP-Q ≥ 3 期且復位後未證實 SUI，屬須額外評估者；NICE 1.9.1 則對前／頂端脫垂「合併」SUI 考慮同時手術。', 'AUA SUI 2・NICE 1.9.1', true]
  ];

  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function shuffle(n, rand) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  let seed = 32; // first render: answers spread evenly over A/B/C, no letter more than twice in a row
  const score = { done: 0, right: 0 };

  function item(kind, i, title, body, opts, rand, badge) {
    const order = shuffle(opts.length, rand);
    return `<article class="${kind}" data-i="${i}"><small>${kind === 'case' ? 'CASE' : 'Q'} ${String(i + 1).padStart(2, '0')}${badge ? ' <em class="badge">高階</em>' : ''}</small><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}<div class="choices">${order.map((n, j) => `<button type="button" class="choice" data-answer="${n}"><b>${'ABC'[j]}</b>${esc(opts[n])}</button>`).join('')}</div><div class="feedback" role="status" hidden></div></article>`;
  }
  function bind(container, getter, onAnswer) {
    container.querySelectorAll('article').forEach(a => a.querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => {
      const f = a.querySelector('.feedback');
      if (!f.hidden) return;
      const ok = b.dataset.answer === '0';
      a.querySelectorAll('.choice').forEach(x => { x.disabled = true; x.classList.toggle('correct', x.dataset.answer === '0'); x.classList.toggle('incorrect', x === b && !ok); });
      const g = getter(Number(a.dataset.i));
      f.hidden = false;
      f.className = 'feedback ' + (ok ? 'ok' : 'no');
      f.innerHTML = `<b>${ok ? '答對了。' : '正解：' + esc(g.answer) + '。'}</b> ${esc(g.why)}${g.src ? `<cite>${esc(g.src)}</cite>` : ''}`;
      if (onAnswer) onAnswer(ok);
    })));
  }
  function renderCases() {
    const rand = rng(10);
    $('#case-list').innerHTML = cases.map((c, i) => item('case', i, c[0], c[1], c[2], rand)).join('');
    bind($('#case-list'), i => ({ answer: cases[i][2][0], why: cases[i][3] }));
  }
  function updateScore() {
    const total = $$('#quiz-list article:not([hidden])').length;
    $('#score').textContent = `${score.right} / ${score.done} 答對・共 ${total} 題`;
    $('#score-bar').style.width = total ? (score.done / total * 100) + '%' : '0';
  }
  function renderQuiz() {
    const rand = rng(seed);
    score.done = score.right = 0;
    $('#quiz-list').innerHTML = quiz.map((q, i) => item('quiz-item', i, q[0], '', q[1], rand, q[4])).join('');
    bind($('#quiz-list'), i => ({ answer: quiz[i][1][0], why: quiz[i][2], src: quiz[i][3] }), ok => { score.done++; if (ok) score.right++; updateScore(); });
    applyFilter();
  }
  function applyFilter() {
    const f = $('.qfilter .active').dataset.filter;
    $$('#quiz-list article').forEach(a => { const adv = quiz[Number(a.dataset.i)][4]; a.hidden = f === 'basic' ? adv : f === 'advanced' ? !adv : false; });
    updateScore();
  }
  $$('.qfilter button').forEach(b => b.addEventListener('click', () => {
    $$('.qfilter button').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    applyFilter();
  }));
  $('#reset').addEventListener('click', () => { seed = (seed * 31 + 7) >>> 0; renderQuiz(); $('#quiz').scrollIntoView({ behavior: 'smooth' }); });
  renderCases();
  renderQuiz();

  /* ---------- full cases ---------- */
  const cite = s => `<cite>${esc(s)}</cite>`;
  $('#full-cases').innerHTML = PF.FULL.map((c, ci) => `<article class="full ${c.cls}">
    <div class="full-head"><small>CASE ${'ABC'[ci]} · ${esc(c.tag)}</small><h3>${esc(c.title)}</h3><p>${esc(c.who)}</p>
      <ul class="full-data">${c.data.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      ${c.popq ? `<button type="button" class="chip-btn" data-popq="${ci}">帶入 POP-Q 計算器 ↑</button>` : ''}</div>
    <div class="full-stages">${c.stages.map((s, si) => `<details class="stage"${si === 0 ? ' open' : ''}>
      <summary><i>${si + 1}</i><span><b>${esc(s.label)}</b>${esc(s.q)}</span></summary>
      <ol class="steps">${s.steps.map(x => `<li><span>${esc(x[0])}</span>${cite(x[1])}</li>`).join('')}</ol>
      ${s.preset ? `<button type="button" class="chip-btn" data-load="${ci}.${si}">帶入互動分流 ↑</button>` : ''}
    </details>`).join('')}</div>
  </article>`).join('');
  $$('[data-load]').forEach(b => b.addEventListener('click', () => {
    const [ci, si] = b.dataset.load.split('.').map(Number);
    write(PF.FULL[ci].stages[si].preset);
    $$('[data-preset]').forEach(x => x.classList.remove('active'));
    sync();
    $('#pathway').scrollIntoView({ behavior: 'smooth' });
  }));
  $$('[data-popq]').forEach(b => b.addEventListener('click', () => {
    const p = PF.FULL[Number(b.dataset.popq)].popq;
    pq.comp.value = p.comp; pq.lead.value = p.lead; pq.tvl.value = p.tvl;
    drawPopq();
    $('#popq').scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- mind map ---------- */
  $('#mindmap').innerHTML = `<div class="mm-root">漏尿・尿急・膨出<small>先分型，再選路徑</small></div>
    <div class="mm-branches">${PF.MAP.map(b => `<details class="mm-branch ${b.cls}" open>
      <summary>${esc(b.title)}</summary>
      <div class="mm-groups">${b.groups.map(g => `<div class="mm-group"><h4>${esc(g.t)}</h4><ul>${g.items.map(x => `<li>${esc(x[0])}${cite(x[1])}</li>`).join('')}</ul></div>`).join('')}</div>
    </details>`).join('')}</div>`;
  const setAll = open => $$('.mm-branch').forEach(d => { d.open = open; });
  $('#mm-open').addEventListener('click', () => setAll(true));
  $('#mm-close').addEventListener('click', () => setAll(false));
})();
