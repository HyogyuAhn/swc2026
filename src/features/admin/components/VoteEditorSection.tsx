import { Settings, Users, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import TimeSelector from './TimeSelector';
import VisibilitySettingCard from './VisibilitySettingCard';
import FormToggleSetting from './FormToggleSetting';

type VoteEditorSectionProps = {
    view: string;
    selectedVote: any;
    getStatus: (vote: any) => 'UPCOMING' | 'ACTIVE' | 'ENDED';
    fetchVoteDetails: (vote: any) => void;
    formData: any;
    setFormData: (value: any) => void;
    removeOption: (index: number) => void;
    handleDelete: () => void;
    handleSave: () => void;
    setView: (view: string) => void;
};

export default function VoteEditorSection({
    view,
    selectedVote,
    getStatus,
    fetchVoteDetails,
    formData,
    setFormData,
    removeOption,
    handleDelete,
    handleSave,
    setView
}: VoteEditorSectionProps) {
    if (view !== 'CREATE' && view !== 'EDIT') {
        return null;
    }

    const status = view === 'EDIT' ? getStatus(selectedVote) : null;
    const isStatusRestricted = view === 'EDIT' && (status === 'ACTIVE' || status === 'ENDED');

    return (
        <div className="p-10 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{view === 'CREATE' ? '새 투표 생성' : '투표 수정 / 관리'}</h2>
                {view === 'EDIT' && (
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                            status === 'ACTIVE'
                                ? 'bg-green-500'
                                : status === 'UPCOMING'
                                    ? 'bg-yellow-400'
                                    : 'bg-red-500'
                        }`}
                    >
                        {status}
                    </span>
                )}
            </div>

            {view === 'EDIT' && (
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => fetchVoteDetails(selectedVote)}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow flex items-center justify-center gap-2"
                    >
                        <Users size={20} />
                        투표 내역 및 유효성 관리 (상세보기)
                    </button>
                </div>
            )}

            <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">투표 제목</label>
                    <input
                        type="text"
                        disabled={isStatusRestricted}
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        value={formData.title}
                        onChange={event => setFormData({ ...formData, title: event.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <label className="block text-sm font-bold text-gray-700">진행 기간</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-500 block mb-2">시작</span>
                            <input
                                type="date"
                                disabled={isStatusRestricted}
                                className="w-full p-2 border rounded mb-2 bg-white"
                                value={formData.startDate}
                                onChange={event => setFormData({ ...formData, startDate: event.target.value })}
                            />
                            <TimeSelector prefix="start" disabled={isStatusRestricted} formData={formData} setFormData={setFormData} />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-500 block mb-2">종료</span>
                            <input
                                type="date"
                                disabled={isStatusRestricted}
                                className="w-full p-2 border rounded mb-2 bg-white"
                                value={formData.endDate}
                                onChange={event => setFormData({ ...formData, endDate: event.target.value })}
                            />
                            <TimeSelector prefix="end" disabled={isStatusRestricted} formData={formData} setFormData={setFormData} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">투표 항목</label>
                    {formData.options.map((option, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                disabled={isStatusRestricted}
                                className="flex-1 p-3 border rounded-lg"
                                value={option}
                                onChange={event => {
                                    const nextOptions = [...formData.options];
                                    nextOptions[index] = event.target.value;
                                    setFormData({ ...formData, options: nextOptions });
                                }}
                            />
                            {!isStatusRestricted && (
                                <button onClick={() => removeOption(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                    {!isStatusRestricted && (
                        <button
                            onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
                            className="text-blue-600 font-bold text-sm flex items-center gap-1 mt-2"
                        >
                            <Plus size={16} />
                            항목 추가
                        </button>
                    )}
                </div>

                <hr className="border-gray-100 my-6" />

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Settings size={18} /> 공개 설정
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VisibilitySettingCard
                            title="실시간 결과"
                            isEnabled={formData.showLiveResults}
                            resultType={formData.liveResultType}
                            showTotal={formData.liveResultShowTotal}
                            showTurnout={formData.liveResultShowTurnout}
                            onModeChange={mode => {
                                if (mode === 'OFF') {
                                    setFormData({ ...formData, showLiveResults: false });
                                    return;
                                }
                                if (mode === 'ALL') {
                                    setFormData({
                                        ...formData,
                                        showLiveResults: true,
                                        liveResultType: 'ALL',
                                        liveResultShowTotal: true,
                                        liveResultShowTurnout: true
                                    });
                                    return;
                                }

                                const defaultPartial = 'COUNT,PERCENT,GAUGE';
                                const nextType = (formData.liveResultType === 'ALL' || formData.liveResultType === 'BOTH')
                                    ? defaultPartial
                                    : (formData.liveResultType || defaultPartial);

                                setFormData({ ...formData, showLiveResults: true, liveResultType: nextType });
                            }}
                            onShowTotalChange={checked => setFormData({ ...formData, liveResultShowTotal: checked })}
                            onShowTurnoutChange={checked => setFormData({ ...formData, liveResultShowTurnout: checked })}
                            onResultTypeChange={type => setFormData({ ...formData, showLiveResults: true, liveResultType: type })}
                        />

                        <VisibilitySettingCard
                            title="종료 후 결과"
                            isEnabled={formData.showFinalResults}
                            resultType={formData.finalResultType}
                            showTotal={formData.finalResultShowTotal}
                            showTurnout={formData.finalResultShowTurnout}
                            onModeChange={mode => {
                                if (mode === 'OFF') {
                                    setFormData({ ...formData, showFinalResults: false });
                                    return;
                                }
                                if (mode === 'ALL') {
                                    setFormData({
                                        ...formData,
                                        showFinalResults: true,
                                        finalResultType: 'ALL',
                                        finalResultShowTotal: true,
                                        finalResultShowTurnout: true
                                    });
                                    return;
                                }

                                const defaultPartial = 'COUNT,PERCENT,GAUGE';
                                const nextType = (formData.finalResultType === 'ALL' || formData.finalResultType === 'BOTH')
                                    ? defaultPartial
                                    : (formData.finalResultType || defaultPartial);

                                setFormData({ ...formData, showFinalResults: true, finalResultType: nextType });
                            }}
                            onShowTotalChange={checked => setFormData({ ...formData, finalResultShowTotal: checked })}
                            onShowTurnoutChange={checked => setFormData({ ...formData, finalResultShowTurnout: checked })}
                            onResultTypeChange={type => setFormData({ ...formData, showFinalResults: true, finalResultType: type })}
                        />

                        <FormToggleSetting
                            checked={formData.allowVoteChangeWhileActive}
                            title="진행 중 투표 항목 수정 허용"
                            description="체크 시 참여자가 진행 중인 투표에서 기존 선택을 다른 항목으로 수정할 수 있습니다."
                            onChange={checked => setFormData({ ...formData, allowVoteChangeWhileActive: checked })}
                        />

                        <FormToggleSetting
                            checked={formData.showBeforeStartOptions}
                            title="투표 시작전 항목 공개"
                            description={
                                <span className="flex items-center gap-1 mt-0.5">
                                    {formData.showBeforeStartOptions ? <Eye size={12} /> : <EyeOff size={12} />}
                                    체크 해제 시 시작 전에는 항목 미리보기가 숨겨집니다.
                                </span>
                            }
                            onChange={checked => setFormData({ ...formData, showBeforeStartOptions: checked })}
                        />

                        <FormToggleSetting
                            checked={formData.showAfterEnd}
                            title="종료 후 투표 목록 노출"
                            description="체크 해제 시 종료된 투표는 목록에서 사라집니다. (핀 고정도 해제됨)"
                            onChange={checked => setFormData({ ...formData, showAfterEnd: checked })}
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-6">
                    {view === 'EDIT' && (
                        <button onClick={handleDelete} className="px-6 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">
                            삭제
                        </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => setView('DASHBOARD')} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">
                        취소
                    </button>
                    <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
