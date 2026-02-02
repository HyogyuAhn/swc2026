import Link from 'next/link';

export default function Home() {
    return (
        <>
            <header>
                <nav>
                    <div class="logo">
                        <span>INHA SW 2026</span>
                    </div>
                    <ul>
                        <li><Link href="#about">소개</Link></li>
                        <li><Link href="#schedule">일정</Link></li>
                        <li><Link href="#location">장소</Link></li>
                        <li><Link href="#faq">FAQ</Link></li>
                    </ul>
                </nav>
            </header>

            <main>
                <section className="hero">
                    <div className="hero-content">
                        <h1>2026 인하대학교<br />소프트웨어융합대학<br />새내기배움터</h1>
                        <p>여러분들의 대학 생활을 응원합니다!</p>
                        <div className="cta-wrapper">
                            <Link href="/vote" className="cta-button">투표 바로가기</Link>
                        </div>
                    </div>
                </section>

                <section id="about" className="info-section">
                    <div className="container">
                        <h2>Welcome to INHA SWC</h2>
                        <div className="grid">
                            <div className="card">
                                <h3>으악 귀찮아</h3>
                                <p>선배들과 동기, 더 나아가 소프트웨어융합대학 소속 학우들과 함께 즐거운 시간을 보낼 수 있을까요..?</p>
                            </div>
                            <div className="card">
                                <h3>ㅠㅠ</h3>
                                <p>다양한 레크레이션과 동아리 공연 등 재밌는 활동이 준비되어 있어요.....,,,,,</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <div className="container">
                    <p>2026 인하대학교 소프트웨어융합대학 학생회</p>
                    <p>문의: inha.swc@gmail.com</p>
                </div>
            </footer>
        </>
    );
}
