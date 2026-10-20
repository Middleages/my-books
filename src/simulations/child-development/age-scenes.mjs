// Original short Korean everyday scenes mapped to CDC source ages, not a clinical checklist.
export const sceneAges=[2,4,6,9,12,15,18,24,30,36];
export const sceneDomains=[{id:'all',title:'모든 영역'},{id:'body',title:'몸 움직임'},{id:'hands',title:'손 사용'},{id:'language',title:'말·소통'},{id:'play',title:'인지·놀이'},{id:'social',title:'관계·정서'}];
export const sceneSources=sceneAges.map(age=>({age,url:`https://www.cdc.gov/act-early/milestones/${({12:'1-year',24:'2-years',36:'3-years'})[age]||age+'-months'}.html`,checked:'2026-10-20',pageDate:'2026-05-15'}));
export const everydayScenes=[
  {
    "id": "2-body",
    "age": 2,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "양팔과 양다리 움직이기",
    "scene": "누워 깨어 있을 때 양팔과 양다리가 움직이는 장면을 봅니다.",
    "observe": "한쪽만 보인 순간과 양쪽 움직임을 본 순간을 구별합니다.",
    "sourceConcept": "양팔과 양다리 움직이기"
  },
  {
    "id": "2-hands",
    "age": 2,
    "tag": "hands",
    "sourceDomain": "movement",
    "title": "잠깐 손을 펴기",
    "scene": "쥔 손이 잠시 펴지는 모습이 보입니다.",
    "observe": "보호자가 손가락을 펴 준 것과 스스로 편 모습을 구별합니다.",
    "sourceConcept": "잠깐 손을 펴기"
  },
  {
    "id": "2-language",
    "age": 2,
    "tag": "language",
    "sourceDomain": "language",
    "title": "울음 아닌 소리",
    "scene": "편안히 깨어 있을 때 울음과 다른 짧은 소리를 냅니다.",
    "observe": "말소리처럼 들리는지 채점하지 말고 들은 소리를 묘사합니다.",
    "sourceConcept": "울음 아닌 소리"
  },
  {
    "id": "2-play",
    "age": 2,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "장난감에 시선 머물기",
    "scene": "앞에 보이는 장난감을 잠시 바라봅니다.",
    "observe": "장난감을 보았는지와 손으로 잡았는지는 다른 관찰입니다.",
    "sourceConcept": "장난감에 시선 머물기"
  },
  {
    "id": "2-social",
    "age": 2,
    "tag": "social",
    "sourceDomain": "social",
    "title": "얼굴 바라보기",
    "scene": "안겨 있거나 마주 보는 때 보호자의 얼굴을 바라봅니다.",
    "observe": "얼굴을 볼 기회와 실제 시선이 향한 곳을 함께 봅니다.",
    "sourceConcept": "얼굴 바라보기"
  },
  {
    "id": "4-body",
    "age": 4,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "안겨서 머리 유지하기",
    "scene": "보호자가 몸을 안고 있을 때 머리를 따로 받치지 않아도 고개를 유지하는 모습을 봅니다.",
    "observe": "몸을 받친 조건을 남기며 머리를 놓아 시험하지 않습니다.",
    "sourceConcept": "안겨서 머리 유지하기"
  },
  {
    "id": "4-hands",
    "age": 4,
    "tag": "hands",
    "sourceDomain": "movement",
    "title": "쥐여 준 장난감 잡기",
    "scene": "손에 놓아 준 적합한 장난감을 손으로 쥡니다.",
    "observe": "쥐여 준 뒤 잡기와 스스로 손을 뻗어 잡기는 다릅니다.",
    "sourceConcept": "쥐여 준 장난감 잡기"
  },
  {
    "id": "4-language",
    "age": 4,
    "tag": "language",
    "sourceDomain": "language",
    "title": "말에 소리로 응답하기",
    "scene": "보호자가 말을 건 뒤 아이가 소리를 내는 장면이 이어집니다.",
    "observe": "누가 먼저 소리를 냈고 다음 소리가 언제 나왔는지 봅니다.",
    "sourceConcept": "말에 소리로 응답하기"
  },
  {
    "id": "4-play",
    "age": 4,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "자기 손 들여다보기",
    "scene": "눈앞에 있는 자기 손에 시선을 두고 살펴봅니다.",
    "observe": "손을 바라보는 것과 입으로 가져가는 것을 따로 봅니다.",
    "sourceConcept": "자기 손 들여다보기"
  },
  {
    "id": "4-social",
    "age": 4,
    "tag": "social",
    "sourceDomain": "social",
    "title": "관심을 끄는 미소",
    "scene": "보호자를 향해 먼저 웃으며 관심을 끄는 모습을 보입니다.",
    "observe": "보호자의 웃음에 반응한 장면과 먼저 웃은 장면을 구별합니다.",
    "sourceConcept": "관심을 끄는 미소"
  },
  {
    "id": "6-body",
    "age": 6,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "엎드림에서 바로 눕기로",
    "scene": "깨어서 보호자가 지켜보는 바닥 놀이 중 엎드린 자세에서 등을 대는 쪽으로 돌아눕습니다.",
    "observe": "방향을 구별합니다. 잠자리 자세를 엎드림으로 바꾸라는 뜻은 아닙니다.",
    "sourceConcept": "엎드림에서 바로 눕기로"
  },
  {
    "id": "6-hands",
    "age": 6,
    "tag": "hands",
    "sourceDomain": "cognitive",
    "title": "원하는 장난감 쪽으로 손 뻗기",
    "scene": "눈앞의 장난감을 잡으려 팔과 손을 뻗습니다.",
    "observe": "손을 뻗은 것과 실제 잡은 결과를 따로 봅니다.",
    "sourceConcept": "원하는 장난감 쪽으로 손 뻗기"
  },
  {
    "id": "6-language",
    "age": 6,
    "tag": "language",
    "sourceDomain": "language",
    "title": "소리 주고받기",
    "scene": "보호자 소리 뒤 아이 소리, 다시 보호자 소리로 차례가 이어집니다.",
    "observe": "같이 난 소리와 번갈아 난 소리를 구별합니다.",
    "sourceConcept": "소리 주고받기"
  },
  {
    "id": "6-play",
    "age": 6,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "입으로도 탐색하기",
    "scene": "손에 닿은 적합한 물체를 입으로 가져가 살피는 장면이 있습니다.",
    "observe": "행동 설명이지 작은 물건을 주라는 놀이 지시가 아닙니다. 안전한 재료와 감독이 먼저입니다.",
    "sourceConcept": "입으로도 탐색하기"
  },
  {
    "id": "6-social",
    "age": 6,
    "tag": "social",
    "sourceDomain": "social",
    "title": "익숙한 사람 알아보기",
    "scene": "자주 돌보는 사람이 다가올 때 알아보는 반응을 보입니다.",
    "observe": "친숙한 사람과 만난 맥락을 보며 반응 하나로 애착을 평가하지 않습니다.",
    "sourceConcept": "익숙한 사람 알아보기"
  },
  {
    "id": "9-body",
    "age": 9,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "지지 없이 앉아 있기",
    "scene": "등을 받쳐 주지 않은 상태로 앉아 있는 모습을 봅니다.",
    "observe": "앉혀 준 뒤 유지한 것과 스스로 앉은 것은 별도 정보입니다.",
    "sourceConcept": "지지 없이 앉아 있기"
  },
  {
    "id": "9-hands",
    "age": 9,
    "tag": "hands",
    "sourceDomain": "movement",
    "title": "다른 손으로 물건 옮기기",
    "scene": "한 손에 든 장난감을 반대 손으로 넘깁니다.",
    "observe": "어느 손에서 어느 손으로 옮겼는지 물체를 따라봅니다.",
    "sourceConcept": "다른 손으로 물건 옮기기"
  },
  {
    "id": "9-language",
    "age": 9,
    "tag": "language",
    "sourceDomain": "language",
    "title": "이어지는 옹알이",
    "scene": "비슷한 음절을 이어 여러 소리를 냅니다.",
    "observe": "성인이 들은 단어 뜻을 임의로 붙이지 않습니다.",
    "sourceConcept": "이어지는 옹알이"
  },
  {
    "id": "9-play",
    "age": 9,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "안 보이는 곳으로 간 물체 찾기",
    "scene": "장난감이 떨어져 시야에서 사라지자 그쪽을 살펴봅니다.",
    "observe": "처음 떨어지는 장면을 보았는지도 함께 남깁니다.",
    "sourceConcept": "안 보이는 곳으로 간 물체 찾기"
  },
  {
    "id": "9-social",
    "age": 9,
    "tag": "social",
    "sourceDomain": "social",
    "title": "까꿍에 웃기",
    "scene": "보호자가 자기 얼굴을 가렸다 보여 주는 놀이에 미소나 웃음으로 반응합니다.",
    "observe": "아이 얼굴은 가리지 않으며 쉬려는 신호가 있으면 멈춥니다.",
    "sourceConcept": "까꿍에 웃기"
  },
  {
    "id": "12-body",
    "age": 12,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "가구 잡고 옆으로 이동하기",
    "scene": "안정된 가구를 잡은 채 발을 옮겨 이동하는 모습을 봅니다.",
    "observe": "가구 지지를 받은 이동을 혼자 걷기로 바꾸어 적지 않습니다.",
    "sourceConcept": "가구 잡고 옆으로 이동하기"
  },
  {
    "id": "12-hands",
    "age": 12,
    "tag": "hands",
    "sourceDomain": "movement",
    "title": "엄지와 집게손가락 함께 쓰기",
    "scene": "물건을 집을 때 엄지와 집게손가락을 마주 사용하는 모습을 봅니다.",
    "observe": "작은 물체를 일부러 주어 시험하지 않습니다. 손가락의 역할을 관찰하는 설명입니다.",
    "sourceConcept": "엄지와 집게손가락 함께 쓰기"
  },
  {
    "id": "12-language",
    "age": 12,
    "tag": "language",
    "sourceDomain": "language",
    "title": "작별 몸짓",
    "scene": "헤어지는 장면에서 손을 흔들어 인사합니다.",
    "observe": "말로 인사하는 것과 몸짓으로 뜻을 나누는 것을 따로 봅니다.",
    "sourceConcept": "작별 몸짓"
  },
  {
    "id": "12-play",
    "age": 12,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "용기 안에 물체 넣기",
    "scene": "놀이 물체를 적합한 그릇 안으로 넣습니다.",
    "observe": "그릇에 닿은 것과 안에 들어간 상태를 구별합니다.",
    "sourceConcept": "용기 안에 물체 넣기"
  },
  {
    "id": "12-social",
    "age": 12,
    "tag": "social",
    "sourceDomain": "social",
    "title": "함께 손뼉 놀이",
    "scene": "보호자와 마주 보며 손뼉을 사용하는 간단한 놀이에 참여합니다.",
    "observe": "혼자 두드리는 행동과 상대와 함께 이어 가는 장면을 봅니다.",
    "sourceConcept": "함께 손뼉 놀이"
  },
  {
    "id": "15-body",
    "age": 15,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "몇 걸음 혼자 옮기기",
    "scene": "잡고 있던 지지물 없이 스스로 몇 걸음을 옮기는 장면이 보입니다.",
    "observe": "걸음 수를 늘리도록 시험하지 말고 실제 지지 유무를 봅니다.",
    "sourceConcept": "몇 걸음 혼자 옮기기"
  },
  {
    "id": "15-hands",
    "age": 15,
    "tag": "hands",
    "sourceDomain": "cognitive",
    "title": "물체 위에 다른 물체 놓기",
    "scene": "놀이 블록 두 개를 위아래로 쌓아 봅니다.",
    "observe": "손으로 놓는 과정과 쌓인 결과를 함께 봅니다. 안전한 크기의 재료를 사용합니다.",
    "sourceConcept": "물체 위에 다른 물체 놓기"
  },
  {
    "id": "15-language",
    "age": 15,
    "tag": "language",
    "sourceDomain": "language",
    "title": "달라고 가리키기",
    "scene": "원하는 물건이나 도움이 필요한 곳을 손가락으로 가리킵니다.",
    "observe": "목적이 요청인지, 재미있는 것을 함께 보자는 뜻인지 맥락을 봅니다.",
    "sourceConcept": "달라고 가리키기"
  },
  {
    "id": "15-play",
    "age": 15,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "생활 물건의 용도 흉내",
    "scene": "장난감 전화기를 귀 가까이 대는 등 익숙한 용도로 써 보려 합니다.",
    "observe": "놀이 장면이며 실제 통화나 사용법 이해를 시험하는 것이 아닙니다.",
    "sourceConcept": "생활 물건의 용도 흉내"
  },
  {
    "id": "15-social",
    "age": 15,
    "tag": "social",
    "sourceDomain": "social",
    "title": "좋아하는 것 보여 주기",
    "scene": "마음에 드는 장난감을 보호자에게 내보입니다.",
    "observe": "건네 달라는 요청과 보여 주며 관심을 나누는 행동을 구별합니다.",
    "sourceConcept": "좋아하는 것 보여 주기"
  },
  {
    "id": "18-body",
    "age": 18,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "붙잡지 않고 걷기",
    "scene": "사람 손이나 가구를 붙잡지 않고 걸어 이동합니다.",
    "observe": "안전한 일상 이동을 보며 속도나 거리를 성과로 비교하지 않습니다.",
    "sourceConcept": "붙잡지 않고 걷기"
  },
  {
    "id": "18-hands",
    "age": 18,
    "tag": "hands",
    "sourceDomain": "movement",
    "title": "종이에 끼적이기",
    "scene": "적합한 그리기 도구로 종이에 선과 흔적을 남깁니다.",
    "observe": "그림 모양의 정확도보다 손과 도구가 남긴 흔적을 봅니다.",
    "sourceConcept": "종이에 끼적이기"
  },
  {
    "id": "18-language",
    "age": 18,
    "tag": "language",
    "sourceDomain": "language",
    "title": "몸짓 없이 한 단계 말 듣기",
    "scene": "손짓을 더하지 않고 말로 부탁했을 때 물건을 건네는 장면이 보입니다.",
    "observe": "말과 손짓을 함께 준 장면인지 구별해 남깁니다.",
    "sourceConcept": "몸짓 없이 한 단계 말 듣기"
  },
  {
    "id": "18-play",
    "age": 18,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "장난감 차 밀기",
    "scene": "바닥의 장난감 차를 손으로 밀어 움직입니다.",
    "observe": "차를 잡는 것과 밀어 움직이는 관계를 살펴봅니다.",
    "sourceConcept": "장난감 차 밀기"
  },
  {
    "id": "18-social",
    "age": 18,
    "tag": "social",
    "sourceDomain": "social",
    "title": "재미있는 것 같이 보자고 가리키기",
    "scene": "창밖의 움직이는 버스를 가리켜 보호자에게 보여 줍니다.",
    "observe": "물건을 얻으려는 요청과 함께 보려는 목적을 구별합니다.",
    "sourceConcept": "재미있는 것 같이 보자고 가리키기"
  },
  {
    "id": "24-body",
    "age": 24,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "공 발로 차기",
    "scene": "바닥의 공 쪽으로 발을 움직여 찹니다.",
    "observe": "우연히 발에 닿은 장면과 차려는 움직임을 구별합니다.",
    "sourceConcept": "공 발로 차기"
  },
  {
    "id": "24-hands",
    "age": 24,
    "tag": "hands",
    "sourceDomain": "cognitive",
    "title": "두 손이 다른 역할 맡기",
    "scene": "한 손으로 통을 붙들고 다른 손으로 뚜껑을 여는 장면이 보입니다.",
    "observe": "잡아 주는 손과 움직이는 손을 각각 봅니다. 위험한 용기는 사용하지 않습니다.",
    "sourceConcept": "두 손이 다른 역할 맡기"
  },
  {
    "id": "24-language",
    "age": 24,
    "tag": "language",
    "sourceDomain": "language",
    "title": "말 두 개 연결하기",
    "scene": "원하는 것을 이야기할 때 두 단어를 이어 짧게 표현합니다.",
    "observe": "표현을 그대로 듣고 정확한 문장으로 고쳐 말하도록 시험하지 않습니다.",
    "sourceConcept": "말 두 개 연결하기"
  },
  {
    "id": "24-play",
    "age": 24,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "놀이 물건 연결하기",
    "scene": "장난감 음식을 장난감 접시에 놓으며 두 물건을 함께 씁니다.",
    "observe": "물건 둘을 각각 만지는 것과 관계 있게 쓰는 것을 봅니다.",
    "sourceConcept": "놀이 물건 연결하기"
  },
  {
    "id": "24-social",
    "age": 24,
    "tag": "social",
    "sourceDomain": "social",
    "title": "다른 사람의 속상함 알아차리기",
    "scene": "누군가 울 때 하던 일을 멈추거나 표정이 달라집니다.",
    "observe": "그 순간의 행동을 적되 공감 능력 전체의 점수로 삼지 않습니다.",
    "sourceConcept": "다른 사람의 속상함 알아차리기"
  },
  {
    "id": "30-body",
    "age": 30,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "두 발 함께 뛰기",
    "scene": "바닥에서 두 발이 함께 떨어지도록 뛰는 모습을 봅니다.",
    "observe": "높이를 겨루거나 높은 곳에서 뛰게 하는 지시가 아닙니다.",
    "sourceConcept": "두 발 함께 뛰기"
  },
  {
    "id": "30-hands",
    "age": 30,
    "tag": "hands",
    "sourceDomain": "movement",
    "title": "책장 한 장씩 넘기기",
    "scene": "함께 읽는 책의 종이를 한 장씩 넘깁니다.",
    "observe": "여러 장을 한꺼번에 잡은 때와 한 장을 넘긴 때를 구별합니다.",
    "sourceConcept": "책장 한 장씩 넘기기"
  },
  {
    "id": "30-language",
    "age": 30,
    "tag": "language",
    "sourceDomain": "language",
    "title": "움직임을 말에 넣기",
    "scene": "‘자동차 가’처럼 행동을 나타내는 말과 다른 말을 이어 표현합니다.",
    "observe": "뜻을 주고받는 장면을 듣고 발음이나 단어 수를 점수화하지 않습니다.",
    "sourceConcept": "움직임을 말에 넣기"
  },
  {
    "id": "30-play",
    "age": 30,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "다른 뜻으로 흉내 놀이",
    "scene": "놀이 블록을 음식인 것처럼 인형에게 주는 시늉을 합니다.",
    "observe": "실제 먹이기와 상징 놀이를 구별하며 물체를 입에 넣지 않습니다.",
    "sourceConcept": "다른 뜻으로 흉내 놀이"
  },
  {
    "id": "30-social",
    "age": 30,
    "tag": "social",
    "sourceDomain": "social",
    "title": "옆에서 놀다 함께하기",
    "scene": "다른 아이 곁에서 놀이하다 때로 같은 놀이에 참여합니다.",
    "observe": "항상 나눠 놀아야 한다고 요구하지 않고 참여 장면을 봅니다.",
    "sourceConcept": "옆에서 놀다 함께하기"
  },
  {
    "id": "36-body",
    "age": 36,
    "tag": "body",
    "sourceDomain": "movement",
    "title": "일부 옷 스스로 입기",
    "scene": "헐렁한 바지나 겉옷 일부를 스스로 입습니다.",
    "observe": "어떤 옷에서 어느 부분을 혼자 했는지, 도움은 무엇이었는지 봅니다.",
    "sourceConcept": "일부 옷 스스로 입기"
  },
  {
    "id": "36-hands",
    "age": 36,
    "tag": "hands",
    "sourceDomain": "movement",
    "title": "포크 사용하기",
    "scene": "식사 자리에서 적합한 포크를 사용해 먹습니다.",
    "observe": "도구 사용 경험과 실제 섭취량을 구별하고 가까이서 안전을 살핍니다.",
    "sourceConcept": "포크 사용하기"
  },
  {
    "id": "36-language",
    "age": 36,
    "tag": "language",
    "sourceDomain": "language",
    "title": "질문으로 대화 잇기",
    "scene": "‘어디 갔어?’처럼 사람·사물·이유를 물으며 대화를 이어 갑니다.",
    "observe": "질문을 얼마나 많이 하는지보다 무엇을 궁금해했는지 들어 봅니다.",
    "sourceConcept": "질문으로 대화 잇기"
  },
  {
    "id": "36-play",
    "age": 36,
    "tag": "play",
    "sourceDomain": "cognitive",
    "title": "원을 보고 그려 보기",
    "scene": "보호자가 그리는 둥근 선을 본 뒤 자신도 원을 그려 봅니다.",
    "observe": "완벽한 원 모양을 요구하지 않고 보여 준 조건과 시도를 봅니다.",
    "sourceConcept": "원을 보고 그려 보기"
  },
  {
    "id": "36-social",
    "age": 36,
    "tag": "social",
    "sourceDomain": "social",
    "title": "다른 아이 놀이에 참여하기",
    "scene": "다른 아이가 노는 모습을 알아보고 그 놀이에 들어갑니다.",
    "observe": "낯선 자리와 익숙한 자리의 맥락을 함께 보며 성격을 평가하지 않습니다.",
    "sourceConcept": "다른 아이 놀이에 참여하기"
  }
];
export function ageSceneFrame(month,domain='all'){
 if(!Number.isInteger(month)||month<0||month>36||!sceneDomains.some(d=>d.id===domain))throw new RangeError('Use a browsing month from 0 through 36 and a known domain');
 const exact=sceneAges.includes(month),before=sceneAges.filter(a=>a<=month).at(-1)??null,after=sceneAges.find(a=>a>=month)??null;
 const ages=exact?[month]:[before,after].filter(a=>a!==null);
 return {month,exact,before,after,interpolated:false,score:null,diagnosis:null,groups:ages.map(age=>({source:{...sceneSources.find(s=>s.age===age)},examples:everydayScenes.filter(e=>e.age===age&&(domain==='all'||e.tag===domain)).map(e=>({...e}))}))};
}
