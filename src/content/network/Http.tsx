import { Check, Sources } from "./shared";
import { RequestLab } from "../../components/network/WebLabs";
export default function Http() {
  return (
    <>
      <p className="lead">
        주소를 찾고 연결도 만들었습니다. 이제 브라우저는 무엇을 보내고 서버는
        무엇으로 답할까요? 앞서 배운 DNS·TCP 위에 요청과 응답의 의미를 얹는 것이
        HTTP입니다.
      </p>
      <div className="learning-goals">
        <strong>이 장을 읽고 나면</strong>
        <ul>
          <li>URL의 이름·포트·경로·질의 문자열을 구분합니다.</li>
          <li>메서드·Host·상태 코드가 말하는 것을 읽습니다.</li>
          <li>HTTP 오류 응답과 연결 전 실패를 구별합니다.</li>
        </ul>
      </div>
      <section className="prose">
        <h2>1. URL은 여러 단계에서 나누어 읽는다</h2>
        <p>
          <code>http://app.example.test:8000/report?day=today#summary</code>를
          예로 들어 봅시다. 이 문자열 전체가 DNS에 질문으로 들어가는 것은
          아닙니다. 각 부분이 쓰이는 시점과 역할이 다릅니다.
        </p>
        <table>
          <thead>
            <tr>
              <th>부분</th>
              <th>뜻과 사용 위치</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>http</td>
              <td>HTTP 접속 방식. https는 TLS로 보호하는 HTTP</td>
            </tr>
            <tr>
              <td>app.example.test</td>
              <td>이름 해석과 서비스 식별에 쓰는 호스트 이름</td>
            </tr>
            <tr>
              <td>8000</td>
              <td>연결할 서버 포트. 생략하면 http는 80, https는 443</td>
            </tr>
            <tr>
              <td>/report</td>
              <td>서버에 요청할 리소스의 경로</td>
            </tr>
            <tr>
              <td>?day=today</td>
              <td>질의 문자열. 서버가 해석할 추가 정보</td>
            </tr>
            <tr>
              <td>#summary</td>
              <td>fragment. HTTP 요청 대상에는 포함하지 않음</td>
            </tr>
          </tbody>
        </table>
        <p>
          fragment는 문서 안의 위치 등 클라이언트에서 사용하는 정보입니다.
          서버의 라우팅 경로와 같지 않습니다. 이 교과서가 주소의 # 뒤에서 장을
          바꾸는 것도 브라우저 안의 코드가 그 값을 해석하기 때문입니다.
        </p>
        <h2>2. 요청은 “무엇을, 어떻게”라는 말</h2>
        <p>
          HTTP/1.1의 단순한 요청은 다음처럼 읽을 수 있습니다. 실제 전송에는 헤더
          종료를 나타내는 빈 줄 등이 있으며, 아래는 이해를 위한 일부입니다.
        </p>
        <pre>
          <code>
            {
              "GET /report?day=today HTTP/1.1\nHost: app.example.test:8000\nAccept: application/json"
            }
          </code>
        </pre>
        <p>
          <strong>GET</strong>은 대상 리소스의 표현을 가져오겠다는 메서드입니다.{" "}
          <strong>POST</strong>는 보낸 내용을 대상 리소스의 규칙에 따라
          처리하도록 요청하는 메서드입니다. POST가 언제나 새 행 생성만 뜻하는
          것은 아닙니다. 메서드는 요청의 의도를 표현하고 서버는 그 규칙을
          구현해야 합니다.
        </p>
        <p>
          <strong>Host</strong>는 어떤 호스트와 포트를 대상으로 하는지 알립니다.
          HTTP/2에서는 <code>:authority</code>가 이 역할을 맡습니다. 같은 IP로
          여러 도메인이 찾아와도 서버나 프록시가 이를 구분할 수 있습니다. 경로는
          그 서비스 안에서 무엇을 요청하는지 나타냅니다.
        </p>
        <p>
          HTTP/2는 요청을 위 예시와 같은 텍스트 줄 그대로 전송하지 않습니다.
          형식이 달라도 메서드·대상·상태 코드 같은 의미는 이어집니다. HTTP/3는
          QUIC을 사용하므로 이번 장의 TCP 단계 그림을 그대로 적용하지 않습니다.
        </p>
        <h2>3. 응답에는 결과를 설명하는 상태가 있다</h2>
        <pre>
          <code>
            {
              'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"report": "today"}'
            }
          </code>
        </pre>
        <p>
          상태 코드는 서버가 요청을 어떻게 처리했는지 알려 주는 단서입니다.
          응답을 받았다고 사용자가 기대한 작업이 모두 끝났다고 단정하지는
          않습니다. 본문과 앱의 업무 규칙도 함께 봐야 합니다.
        </p>
        <table>
          <thead>
            <tr>
              <th>예시</th>
              <th>읽는 법</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>200</td>
              <td>요청 성공. 구체적인 의미는 메서드에 따라 다름</td>
            </tr>
            <tr>
              <td>301·302·307·308</td>
              <td>
                다른 대상으로 이동하도록 안내. 코드별 메서드 처리 차이가 있음
              </td>
            </tr>
            <tr>
              <td>401 / 403</td>
              <td>유효한 인증 자격 필요 / 서버가 요청 수행을 거절</td>
            </tr>
            <tr>
              <td>404</td>
              <td>대상 리소스를 찾지 못했거나 존재를 공개하지 않음</td>
            </tr>
            <tr>
              <td>500</td>
              <td>서버가 예상하지 못한 조건으로 처리하지 못함</td>
            </tr>
            <tr>
              <td>502 / 504</td>
              <td>게이트웨이의 upstream 응답 문제 / 제때 응답을 받지 못함</td>
            </tr>
          </tbody>
        </table>
        <p>
          4xx를 모두 네트워크 장애로, 5xx를 모두 방화벽 문제로 읽지 마세요.
          404를 받았다면 적어도 어떤 HTTP 서버가 응답한 것입니다. 다만 그 서버가
          내가 의도한 앱인지는 Host·경로·프록시 설정을 더 확인해야 합니다.
        </p>
      </section>
      <RequestLab />
      <section className="prose">
        <h2>4. HTTPS에서는 HTTP보다 먼저 상대를 확인한다</h2>
        <p>
          새 HTTPS 연결에서는 TCP 연결 뒤에 TLS 협상과 서버 인증서 검증이
          들어갑니다. 인증서를 신뢰하지 못해 중단한 것은 HTTP 500 응답을 받은
          것과 다릅니다. 일반적인 초기 연결에서 검증이 끝나지 않으면 앱의 HTTP
          요청까지 나아가지 못합니다.
        </p>
        <p>
          이 실험은 새 연결만 보여 줍니다. 실제 브라우저는 DNS 캐시나 기존
          연결을 재사용하고, 리다이렉트를 따라 추가 요청을 보내기도 합니다. 화면
          하나를 여는 과정에는 HTML·이미지·API 등 여러 요청이 있을 수 있습니다.
        </p>
        <h2>5. 실제 상황: 404가 뜨는데 포트를 더 열어야 할까?</h2>
        <p>
          먼저 개발자 도구의 Network에서 요청 URL·메서드·상태·응답 내용을
          확인하세요. 응답을 보낸 서비스가 맞는지, 경로 접두사가 필요한지,
          리다이렉트 뒤 URL이 달라졌는지 살펴봅니다. HTTP 응답이라는 증거가 있는
          상황에서 방화벽을 무작정 넓히는 것은 원인을 겨냥한 조치가 아닙니다.
        </p>
        <div className="note">
          <strong>읽기 전용 관찰 · 요청을 보내는 PC에서</strong>
          <pre>
            <code>
              curl -v --connect-timeout 5 http://app.example.test:8000/report
            </code>
          </pre>
          <p>
            가상 주소 예시입니다. 실제 서비스에서는 URL과 접근 정책을
            확인하세요. 연결 로그와 요청·응답 헤더를 구분해 읽고, 로그를
            공유하기 전 쿠키·토큰을 가립니다. 사내 프록시가 개입하면 연결 상대도
            달라질 수 있습니다.
          </p>
        </div>
        <h2>확인해 보기</h2>
        <Check question="HTTP 404와 DNS 이름 없음은 같은 실패인가요?">
          아닙니다. 404는 HTTP 응답이고 DNS 이름 없음은 주소 조회 단계입니다.
          다음 확인 대상이 달라집니다.
        </Check>
        <Check question="/report를 /admin으로 바꾸면 DNS 조회도 다른 이름으로 하나요?">
          호스트 이름이 같다면 일반적인 A/AAAA 조회 대상은 같습니다. 경로는 HTTP
          단계에서 해석합니다.
        </Check>
        <Check question="Host를 바꾸면 TLS의 SNI도 함께 바뀌나요?">
          진단 도구에서 Host 헤더만 바꾸면 그렇지 않습니다. TLS의 서버 이름과
          인증서 검증 대상은 별도로 결정됩니다. 다음 장에서 구분합니다.
        </Check>
        <Sources
          items={[
            [
              "RFC 9110 — URL, Host/authority, 메서드와 상태 코드",
              "https://www.rfc-editor.org/rfc/rfc9110.html",
            ],
            [
              "RFC 9112 — HTTP/1.1 메시지 형식",
              "https://www.rfc-editor.org/rfc/rfc9112.html",
            ],
            ["curl 공식 사용 설명서", "https://curl.se/docs/manpage.html"],
            [
              "학습 구성 참고: NetworkBook · DNS, 웹, 스트리밍",
              "https://networkbook.euiyun.com/chapters/apps.html",
            ],
          ]}
        />
      </section>
    </>
  );
}
