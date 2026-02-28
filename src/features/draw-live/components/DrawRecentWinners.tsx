import { DrawRecentWinner } from '@/features/draw-live/types';

type DrawRecentWinnersProps = {
    winners: DrawRecentWinner[];
    studentNumberById: Record<string, string>;
};

export default function DrawRecentWinners({ winners, studentNumberById }: DrawRecentWinnersProps) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">최근 당첨 결과</h3>
                <span className="text-xs font-semibold text-gray-400">최신순</span>
            </div>

            {winners.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-400">
                    아직 공개된 당첨 결과가 없습니다.
                </p>
            ) : (
                <div className="space-y-2">
                    {winners.map(winner => (
                        <div key={`${winner.id}-${winner.created_at}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{winner.draw_item_name}</p>
                                <p className="text-xs text-gray-400">{new Date(winner.created_at).toLocaleString()}</p>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                                <span className="text-[11px] font-bold text-blue-600">당첨 번호</span>
                                <span className="font-mono text-xl font-extrabold tracking-wide text-blue-900">
                                    {studentNumberById[winner.student_id] || '번호 미지정'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
