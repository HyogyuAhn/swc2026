import { supabase } from '@/lib/supabase';

export async function fetchVoteSnapshot() {
    const { data: votesData } = await supabase
        .from('votes')
        .select('*, vote_options(*)')
        .order('start_at', { ascending: false });

    const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

    const { data: records } = await supabase
        .from('vote_records')
        .select('vote_id, option_id')
        .eq('is_valid', true);

    return {
        votesData,
        totalStudents: count ?? 0,
        records
    };
}

export async function fetchStudentStatus(studentId: string) {
    return supabase
        .from('students')
        .select('is_suspended')
        .eq('student_id', studentId)
        .maybeSingle();
}

export async function fetchStudentVotes(studentId: string) {
    return supabase
        .from('vote_records')
        .select('vote_id, option_id')
        .eq('student_id', studentId);
}

type UpsertVoteRecordParams = {
    voteId: string;
    studentId: string;
    optionId: string;
    allowUpdate: boolean;
};

export async function upsertVoteRecord({
    voteId,
    studentId,
    optionId,
    allowUpdate
}: UpsertVoteRecordParams) {
    if (!allowUpdate) {
        const { error } = await supabase
            .from('vote_records')
            .insert({
                vote_id: voteId,
                student_id: studentId,
                option_id: optionId,
                is_valid: true
            });

        return {
            error,
            mode: 'insert' as const
        };
    }

    const { data: existingRecord, error: fetchError } = await supabase
        .from('vote_records')
        .select('id')
        .eq('vote_id', voteId)
        .eq('student_id', studentId)
        .maybeSingle();

    if (fetchError) {
        return {
            error: fetchError,
            mode: 'fetch_error' as const
        };
    }

    if (existingRecord) {
        const { error } = await supabase
            .from('vote_records')
            .update({ option_id: optionId })
            .eq('id', existingRecord.id);

        return {
            error,
            mode: 'update' as const
        };
    }

    const { error } = await supabase
        .from('vote_records')
        .insert({
            vote_id: voteId,
            student_id: studentId,
            option_id: optionId,
            is_valid: true
        });

    return {
        error,
        mode: 'insert' as const
    };
}
