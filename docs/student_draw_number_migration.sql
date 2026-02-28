-- 학생별 추첨 번호 컬럼 추가
alter table public.students
  add column if not exists draw_number text;

-- 번호는 중복 불가 (NULL 허용)
create unique index if not exists students_draw_number_unique_idx
  on public.students (draw_number)
  where draw_number is not null;

-- 선택: 기존 번호 공백 정리
update public.students
set draw_number = null
where draw_number is not null and btrim(draw_number) = '';

-- 확인 쿼리
select student_id, draw_number, is_suspended, created_at
from public.students
order by created_at desc;
