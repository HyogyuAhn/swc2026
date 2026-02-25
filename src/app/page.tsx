'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type ScheduleItem = {
    day: 'Day 1' | 'Day 2';
    time: string;
    title: string;
};

const scheduleItems: ScheduleItem[] = [
    { day: 'Day 1', time: '9:30', title: '인하대학교 운동장 집결' },
    { day: 'Day 1', time: '9:30 ~ 11:30', title: '인원 점검 및 컨벤션 센터 이동' },
    { day: 'Day 1', time: '11:30 ~ 13:00', title: '안전/성교육 및 SW중심대학사업단 멘토링' },
    { day: 'Day 1', time: '13:00 ~ 15:00', title: '점심식사 및 조별 주루마블 제작' },
    { day: 'Day 1', time: '15:00 ~ 16:00', title: '교수님 말씀 및 PG소개' },
    { day: 'Day 1', time: '16:00 ~ 18:30', title: '조별 PG' },
    { day: 'Day 1', time: '18:30 ~ 20:00', title: '저녁식사 및 휴식' },
    { day: 'Day 1', time: '20:00 ~ 22:30', title: '2차 PG 및 동아리 공연' },
    { day: 'Day 1', time: '22:30 ~ 23:00', title: '뒤풀이 안전교육 및 숙소 이동' },
    { day: 'Day 1', time: '23:00 ~ 00:00', title: '조별 뒤풀이 진행' },
    { day: 'Day 1', time: '00:00 ~ 02:00', title: '방돌이 진행' },
    { day: 'Day 2', time: '9:00 ~ 10:00', title: '기상 및 아침식사 (선택)' },
    { day: 'Day 2', time: '10:00 ~ 11:00', title: '퇴실 준비 및 인원점검' },
    { day: 'Day 2', time: '11:00 ~ 12:00', title: '퇴실 및 학교 이동' },
];

const cardFrames = Array.from({ length: 7 }, (_, i) => `/images/${String(i + 1).padStart(3, '0')}.png`);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function Home() {
    const timelineSectionRef = useRef<HTMLElement | null>(null);
    const storySectionRef = useRef<HTMLElement | null>(null);

    const [timelineProgress, setTimelineProgress] = useState(0);
    const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
    const [storyProgress, setStoryProgress] = useState(0);

    useEffect(() => {
        let rafId = 0;

        const updateProgress = () => {
            const viewport = window.innerHeight;
            const scrollY = window.scrollY;

            if (timelineSectionRef.current) {
                const rect = timelineSectionRef.current.getBoundingClientRect();
                const top = scrollY + rect.top;
                const start = top - viewport * 0.65;
                const end = top + rect.height - viewport * 0.35;
                const progress = clamp((scrollY - start) / Math.max(1, end - start), 0, 1);

                setTimelineProgress(prev => (Math.abs(prev - progress) > 0.001 ? progress : prev));

                const nextIndex = clamp(Math.floor(progress * scheduleItems.length), 0, scheduleItems.length - 1);
                setActiveTimelineIndex(prev => (prev === nextIndex ? prev : nextIndex));
            }

            if (storySectionRef.current) {
                const rect = storySectionRef.current.getBoundingClientRect();
                const top = scrollY + rect.top;
                const start = top - viewport * 0.2;
                const end = top + rect.height - viewport * 0.9;
                const raw = clamp((scrollY - start) / Math.max(1, end - start), 0, 1);
                const progress = Math.round(raw * (cardFrames.length - 1) * 1000) / 1000;

                setStoryProgress(prev => (Math.abs(prev - progress) > 0.004 ? progress : prev));
            }
        };

        const onScroll = () => {
            if (rafId) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = 0;
                updateProgress();
            });
        };

        updateProgress();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            if (rafId) window.cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return (
        <>
            <header>
                <nav>
                    <div className="logo">
                        <span>소프트웨어융합대학 2026 새내기 새로배움터</span>
                    </div>
                    <ul>
                        <li><Link href="#hero">메인</Link></li>
                        <li><Link href="#story">소개</Link></li>
                        <li><Link href="#schedule">일정</Link></li>
                        <li><Link href="#apply">신청</Link></li>
                    </ul>
                </nav>
            </header>

            <main>
                <section id="hero" className="hero">
                    <div className="hero-content">
                        <Image
                            src="/images/hero.png"
                            alt="2026 새내기 새로배움터"
                            width={871}
                            height={579}
                            className="hero-main-image"
                            priority
                        />
                        <p>여러분들의 대학 생활을 응원합니다!</p>
                        <div className="cta-wrapper">
                            <Link href="/vote" className="cta-button">뭘까요</Link>
                        </div>
                    </div>
                </section>

                <section
                    id="story"
                    ref={storySectionRef}
                    className="story-scroll"
                    aria-label="카드뉴스 소개"
                    style={{ height: `${cardFrames.length * 80}svh` }}
                >
                    <div className="story-sticky">
                        <div className="story-stage-wrap">
                            <div className="story-stage" aria-live="polite">
                                {cardFrames.map((src, index) => {
                                    const delta = index - storyProgress;
                                    const translateX = clamp(delta * 100, -108, 108);
                                    const scale = clamp(1 - Math.abs(delta) * 0.08, 0.88, 1);
                                    const opacity = clamp(1 - Math.abs(delta) * 0.6, 0, 1);

                                    return (
                                        <div
                                            key={src}
                                            className="story-card"
                                            style={{
                                                transform: `translate3d(${translateX}%, 0, 0) scale(${scale})`,
                                                opacity,
                                                zIndex: Math.round(100 - Math.abs(delta) * 10),
                                            }}
                                        >
                                            <Image
                                                src={src}
                                                alt={`새내기 새로배움터 카드뉴스 ${String(index + 1).padStart(3, '0')}`}
                                                fill
                                                sizes="(max-width: 768px) 90vw, 620px"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="schedule" ref={timelineSectionRef} className="roadmap-section">
                    <div className="container roadmap-container">
                        <h2 className="roadmap-title">DAY 1 · DAY 2 일정 시간표</h2>

                        <div className="roadmap-track">
                            <div className="roadmap-line" />
                            <div className="roadmap-line-progress" style={{ transform: `scaleY(${timelineProgress})` }} />

                            <div className="roadmap-items">
                                {scheduleItems.map((item, index) => {
                                    const isDayStart = index === 0 || scheduleItems[index - 1].day !== item.day;
                                    const isActive = index <= activeTimelineIndex;
                                    const isCurrent = index === activeTimelineIndex;

                                    return (
                                        <article
                                            key={`${item.day}-${item.time}-${index}`}
                                            className={`roadmap-item${isDayStart ? ' is-day-start' : ''}${isActive ? ' is-active' : ''}${isCurrent ? ' is-current' : ''}`}
                                        >
                                            {isDayStart && <p className="roadmap-day">{item.day}</p>}
                                            <span className="roadmap-node" aria-hidden="true" />
                                            <div className="roadmap-card">
                                                <p className="roadmap-time">{item.time}</p>
                                                <p className="roadmap-text">{item.title}</p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="apply" className="apply-section">
                    <div className="container apply-container">
                        <p className="apply-eyebrow">APPLICATION</p>
                        <h2 className="apply-title">신청폼 접수</h2>
                        <p className="apply-desc">신입생/재학생 구글폼에서 신청을 진행해주세요.</p>
                        <p className="apply-refund">환불은 27일까지 가능합니다.</p>
                        <div className="apply-actions">
                            <div className="apply-option">
                                <p className="apply-price">60,000원</p>
                                <a
                                    className="apply-button freshman"
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSeyMwPyRMwN-MPGRe01Lg0dXiHiPJdHMGQvMD-UZcDtb3DWrg/viewform"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    신입생 신청
                                </a>
                            </div>
                            <div className="apply-option">
                                <p className="apply-price">50,000원</p>
                                <a
                                    className="apply-button enrolled"
                                    href="https://docs.google.com/forms/d/e/1FAIpQLScGahYbJMHS_ao-Qc7dFVnRqr15b2XNuKz3Lj6CGYRq-Dhh_g/viewform"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    재학생 신청
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <div className="container footer-container">
                    <div className="footer-grid">
                        <article className="footer-item">
                            <p className="footer-label">주최</p>
                            <p className="footer-value">인하대학교 제3대 소프트웨어융합대학 학생회</p>
                        </article>
                        <article className="footer-item">
                            <p className="footer-label">주관</p>
                            <p className="footer-value">인하대학교 소프트웨어융합대학 새터준비위원회</p>
                        </article>
                        <article className="footer-item">
                            <p className="footer-label">문의</p>
                            <a className="footer-value footer-link" href="mailto:inha.swc@gmail.com">inha.swc@gmail.com</a>
                        </article>
                    </div>
                </div>
            </footer>
        </>
    );
}
