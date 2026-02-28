'use client';

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ShowToast = (message: string, kind?: 'error' | 'info') => void;

const createDefaultFormData = () => ({
    title: '',
    startDate: '', startHour: '00', startMinute: '00', startSecond: '00',
    endDate: '', endHour: '00', endMinute: '00', endSecond: '00',
    options: [''],
    showLiveResults: false,
    liveResultType: 'BOTH',
    liveResultShowTotal: true,
    liveResultShowTurnout: false,
    showFinalResults: false,
    finalResultType: 'BOTH',
    finalResultShowTotal: true,
    finalResultShowTurnout: true,
    showAfterEnd: true,
    showBeforeStartOptions: true,
    allowVoteChangeWhileActive: false
});

const createFormDataForCreate = () => ({
    title: '',
    startDate: '', startHour: '00', startMinute: '00', startSecond: '00',
    endDate: '', endHour: '00', endMinute: '00', endSecond: '00',
    options: [''],
    showLiveResults: false,
    liveResultType: 'ALL',
    liveResultShowTotal: true,
    liveResultShowTurnout: true,
    showFinalResults: false,
    finalResultType: 'ALL',
    finalResultShowTotal: true,
    finalResultShowTurnout: true,
    showAfterEnd: true,
    showBeforeStartOptions: true,
    allowVoteChangeWhileActive: false
});

type UseVoteEditorFormParams = {
    selectedVote: any;
    setSelectedVote: (vote: any) => void;
    fetchVotes: () => Promise<void>;
    getStatus: (vote: any) => 'UPCOMING' | 'ACTIVE' | 'ENDED';
};

export default function useVoteEditorForm({
    selectedVote,
    setSelectedVote,
    fetchVotes,
    getStatus
}: UseVoteEditorFormParams) {
    const [formData, setFormData] = useState(createDefaultFormData);

    const parseDateToForm = (iso: string) => {
        const date = new Date(iso);

        return {
            date: date.toISOString().split('T')[0],
            hour: date.getHours().toString().padStart(2, '0'),
            minute: date.getMinutes().toString().padStart(2, '0'),
            second: date.getSeconds().toString().padStart(2, '0')
        };
    };

    const startCreate = useCallback(() => {
        setFormData(createFormDataForCreate());
        setSelectedVote(null);
    }, [setSelectedVote]);

    const startEdit = useCallback((vote: any) => {
        const start = parseDateToForm(vote.start_at);
        const end = parseDateToForm(vote.end_at);

        setFormData({
            title: vote.title,
            startDate: start.date, startHour: start.hour, startMinute: start.minute, startSecond: start.second,
            endDate: end.date, endHour: end.hour, endMinute: end.minute, endSecond: end.second,
            options: vote.vote_options.map(option => option.name),
            showLiveResults: vote.show_live_results || false,
            liveResultType: vote.live_result_type || 'BOTH',
            liveResultShowTotal: vote.live_result_show_total ?? true,
            liveResultShowTurnout: vote.live_result_show_turnout ?? false,
            showFinalResults: vote.show_final_results || false,
            finalResultType: vote.final_result_type || 'BOTH',
            finalResultShowTotal: vote.final_result_show_total ?? true,
            finalResultShowTurnout: vote.final_result_show_turnout ?? true,
            showAfterEnd: vote.show_after_end ?? true,
            showBeforeStartOptions: vote.show_before_start_options ?? true,
            allowVoteChangeWhileActive: vote.allow_vote_change_while_active ?? false
        });

        setSelectedVote(vote);
    }, [setSelectedVote]);

    const convertToISO = (date: string, hour: string, minute: string, second: string) => {
        return new Date(`${date}T${hour}:${minute}:${second}`).toISOString();
    };

    const handleSave = useCallback(async (
        view: string,
        showToast: ShowToast,
        onSaved: () => void
    ) => {
        if (!formData.title || !formData.startDate || !formData.endDate) {
            alert('필수 정보를 입력해주세요.');
            return;
        }

        const startAt = convertToISO(formData.startDate, formData.startHour, formData.startMinute, formData.startSecond);
        const endAt = convertToISO(formData.endDate, formData.endHour, formData.endMinute, formData.endSecond);

        if (new Date(endAt) <= new Date(startAt)) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        const status = view === 'EDIT' && selectedVote ? getStatus(selectedVote) : 'NEW';
        const isRestricted = status === 'ACTIVE' || status === 'ENDED';
        const sanitizedOptions = formData.options
            .map(option => option.trim())
            .filter(option => option !== '');

        if (!isRestricted && sanitizedOptions.length === 0) {
            showToast('투표 항목을 1개 이상 입력해주세요.');
            return;
        }

        const votePayload = {
            title: formData.title,
            start_at: startAt,
            end_at: endAt,
            show_live_results: formData.showLiveResults,
            live_result_type: formData.liveResultType,
            live_result_show_total: formData.liveResultShowTotal,
            live_result_show_turnout: formData.liveResultShowTurnout,
            show_final_results: formData.showFinalResults,
            final_result_type: formData.finalResultType,
            final_result_show_total: formData.finalResultShowTotal,
            final_result_show_turnout: formData.finalResultShowTurnout,
            show_after_end: formData.showAfterEnd,
            show_before_start_options: formData.showBeforeStartOptions,
            allow_vote_change_while_active: formData.allowVoteChangeWhileActive,
            ...(formData.showAfterEnd ? {} : { is_pinned: false })
        };

        if (view === 'EDIT' && isRestricted && selectedVote) {
            const { error } = await supabase
                .from('votes')
                .update({
                    show_live_results: formData.showLiveResults,
                    live_result_type: formData.liveResultType,
                    live_result_show_total: formData.liveResultShowTotal,
                    live_result_show_turnout: formData.liveResultShowTurnout,
                    show_final_results: formData.showFinalResults,
                    final_result_type: formData.finalResultType,
                    final_result_show_total: formData.finalResultShowTotal,
                    final_result_show_turnout: formData.finalResultShowTurnout,
                    show_after_end: formData.showAfterEnd,
                    show_before_start_options: formData.showBeforeStartOptions,
                    allow_vote_change_while_active: formData.allowVoteChangeWhileActive,
                    ...(formData.showAfterEnd ? {} : { is_pinned: false })
                })
                .eq('id', selectedVote.id);

            if (error) {
                alert(error.message);
                return;
            }

            alert('설정이 저장되었습니다.');
            fetchVotes();
            onSaved();
            return;
        }

        let voteId = selectedVote?.id;

        if (view === 'CREATE') {
            const { data, error } = await supabase
                .from('votes')
                .insert(votePayload)
                .select()
                .single();

            if (error) {
                alert(error.message);
                return;
            }

            voteId = data.id;
        } else {
            const { error } = await supabase
                .from('votes')
                .update(votePayload)
                .eq('id', voteId);

            if (error) {
                alert(error.message);
                return;
            }
        }

        if (!isRestricted) {
            if (view === 'EDIT') {
                await supabase
                    .from('vote_options')
                    .delete()
                    .eq('vote_id', voteId);
            }

            const optionsToInsert = formData.options
                .map(option => option.trim())
                .filter(option => option !== '')
                .map(name => ({ vote_id: voteId, name }));

            await supabase
                .from('vote_options')
                .insert(optionsToInsert);
        }

        alert('저장되었습니다.');
        fetchVotes();
        onSaved();
    }, [fetchVotes, formData, getStatus, selectedVote]);

    const handleDelete = useCallback(async (onDeleted: () => void) => {
        if (!selectedVote) {
            return;
        }

        if (!confirm('정말 이 투표를 삭제하시겠습니까? 데이터가 복구되지 않습니다.')) {
            return;
        }

        await supabase
            .from('votes')
            .delete()
            .eq('id', selectedVote.id);

        fetchVotes();
        onDeleted();
    }, [fetchVotes, selectedVote]);

    const handleEarlyEnd = useCallback(async (vote: any) => {
        if (!confirm('정말 조기 종료하시겠습니까?')) {
            return;
        }

        await supabase
            .from('votes')
            .update({ end_at: new Date().toISOString() })
            .eq('id', vote.id);

        fetchVotes();
    }, [fetchVotes]);

    const removeOption = useCallback((index: number) => {
        setFormData(prev => {
            if (prev.options.length <= 1) {
                return prev;
            }

            return {
                ...prev,
                options: prev.options.filter((_, i) => i !== index)
            };
        });
    }, []);

    return {
        formData,
        setFormData,
        startCreate,
        startEdit,
        handleSave,
        handleDelete,
        handleEarlyEnd,
        removeOption
    };
}
