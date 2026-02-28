import type { FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ToastBanner from '@/features/vote/common/ToastBanner';
import { ToastState } from '@/features/vote/common/types';

const LOGIN_CARD_ASPECT_RATIO = 1;

type VoteLoginScreenProps = {
    studentId: string;
    onStudentIdChange: (value: string) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    isLoginButtonPressed: boolean;
    setIsLoginButtonPressed: (pressed: boolean) => void;
    toast: ToastState;
};

export default function VoteLoginScreen({
    studentId,
    onStudentIdChange,
    onSubmit,
    isLoginButtonPressed,
    setIsLoginButtonPressed,
    toast
}: VoteLoginScreenProps) {
    return (
        <div className="relative flex h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-[#f3f7ff] via-[#edf4ff] to-[#e4eeff]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(72,141,255,0.2),transparent_44%),radial-gradient(circle_at_82%_84%,rgba(125,169,255,0.15),transparent_46%)]" />

            <header className="relative z-20 shrink-0 border-b border-[#d8e3f7] bg-white/85 backdrop-blur !relative !top-auto !w-auto">
                <div className="flex h-14 w-full items-center justify-between px-4 sm:px-8">
                    <p className="max-w-[68%] truncate text-sm font-semibold tracking-tight text-[#20467f] sm:max-w-none sm:text-base">
                        소프트웨어융합대학 2026 새내기 새로배움터 투표
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 rounded-full border border-[#c9d8f5] bg-white px-3 py-1 text-xs font-semibold text-[#20467f] shadow-sm transition hover:bg-[#f5f9ff] sm:text-sm"
                    >
                        <ChevronLeft size={16} />
                        뒤로가기
                    </Link>
                </div>
            </header>

            <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
                <form
                    onSubmit={onSubmit}
                    className="w-full"
                    style={{
                        width: `min(92vw, 760px, calc((100dvh - 56px - 1.5rem) * ${LOGIN_CARD_ASPECT_RATIO}))`,
                    }}
                >
                    <div className="relative w-full aspect-square">
                        <Image
                            src="/images/vote_login.png"
                            alt="투표 시스템 로그인"
                            fill
                            sizes="(max-width: 768px) 92vw, 760px"
                            style={{ objectPosition: '50% 53%' }}
                            className="select-none object-cover"
                            priority
                        />

                        <div className="absolute left-1/2 top-[60.5%] h-[10%] w-[66.6%] -translate-x-1/2 -translate-y-1/2">
                            <label htmlFor="student-id-input" className="sr-only">학번 입력</label>
                            <input
                                id="student-id-input"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                pattern="[0-9]*"
                                maxLength={8}
                                value={studentId}
                                onChange={e => onStudentIdChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="h-full w-full bg-transparent px-[7%] text-center text-[clamp(16px,2vw,30px)] font-semibold tracking-[0.2em] text-[#1f2430] outline-none placeholder:text-[#9ca3af]"
                                placeholder="학번 8자리"
                            />
                        </div>

                        <div className="absolute left-1/2 top-[77%] w-[30.2%] -translate-x-1/2 -translate-y-1/2">
                            <button
                                type="submit"
                                aria-label="참여하기"
                                className="block w-full active:translate-y-px transition-transform"
                                onPointerDown={() => setIsLoginButtonPressed(true)}
                                onPointerUp={() => setIsLoginButtonPressed(false)}
                                onPointerLeave={() => setIsLoginButtonPressed(false)}
                                onPointerCancel={() => setIsLoginButtonPressed(false)}
                                onBlur={() => setIsLoginButtonPressed(false)}
                            >
                                <Image
                                    src={isLoginButtonPressed ? '/images/vote_login_btn_push.png' : '/images/vote_login_btn_base.png'}
                                    alt="참여하기"
                                    width={364}
                                    height={126}
                                    className="h-auto w-full"
                                    priority
                                />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <ToastBanner
                toast={toast}
                positionClassName="fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.25rem)] z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-6 sm:top-auto sm:bottom-6 sm:w-auto sm:min-w-[360px] sm:max-w-[460px] sm:translate-x-0"
            />
        </div>
    );
}
