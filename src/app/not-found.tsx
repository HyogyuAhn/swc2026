import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white overflow-hidden relative text-slate-800">
            <div className="absolute w-[500px] h-[500px] bg-radial-gradient from-sky-400/10 to-transparent rounded-full blur-3xl animate-pulse top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10"></div>

            <div className="relative z-10 text-center p-12 bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl max-w-lg w-[90%]">
                <div className="text-xl font-bold text-blue-700 mb-4 tracking-widest uppercase">INHA-SWC</div>
                <h1 className="text-8xl font-black mb-4 bg-gradient-to-br from-blue-700 to-sky-400 bg-clip-text text-transparent">
                    Error
                </h1>
                <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
                    요청하신 페이지가 존재하지 않거나<br />
                    주소가 변경되었을 수 있습니다.
                </p>
                <Link
                    href="/"
                    className="inline-block px-8 py-4 bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 hover:shadow-blue-700/30 hover:-translate-y-1 transition-all duration-300"
                >
                    메인으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
