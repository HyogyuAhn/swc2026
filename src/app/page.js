import Link from 'next/link';

export default function Home() {
    return (
        <>
            <header>
                <nav>
                    <div class="logo">
                        <span>소프트웨어융합대학 2026 새내기 새로배움터</span>
                    </div>
                    <ul>
                        <li><Link href="#hero">메인</Link></li>
                        <li><Link href="#about">소개</Link></li>
                    </ul>
                </nav>
            </header>

            <main>
                <section className="hero">
                    <div className="hero-content">
                        <h1>2026 인하대학교<br />소프트웨어융합대학<br />새내기 새로배움터</h1>
                        <p>여러분들의 대학 생활을 응원합니다!</p>
                        <div className="cta-wrapper">
                            <Link href="/#prepare" className="cta-button">준비중</Link>
                        </div>
                    </div>
                </section>

                <section id="about" className="info-section">
                    <div className="container">
                        <h2>소프트웨어융합대학 새내기 새로배움터에 초대합니다.</h2>
                        <div className="grid">
                            <div className="card">
                                <h2>🗓️ 일정</h2>
                                <p>26. 03. 07 ~ 26. 03. 08</p>
                            </div>
                            <div className="card">
                                <h2>📍 장소</h2>
                                <p>시흥오이도컨벤션</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <div className="container">
                    <p>주최  |  인하대학교 제3대 소프트웨어융합대학 학생회    주관  |  인하대학교 소프트웨어융합대학 새터준비위원회</p>
                    <p>문의: inha.swc@gmail.com</p>
                </div>
            </footer>
        </>
    );
}
