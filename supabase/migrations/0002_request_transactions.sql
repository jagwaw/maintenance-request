-- Request writes that must succeed or fail together.
-- Run after 0001_init.sql. Safe to re-run (create or replace).
--
-- Each function runs in a single transaction: if any statement fails (for example
-- the history insert), every change it made is rolled back.
-- Only the service role (our server routes) may call these. Postgres lets PUBLIC
-- execute new functions by default, and Supabase exposes functions through its API,
-- so the revoke below is required.

-- Change a request's status and/or vendor, and record each change in the history.
--   p_status     new status, or null to leave it unchanged
--   p_set_vendor true to change the vendor (p_vendor_id null = unassign)
-- Raises 'not_found' if the request doesn't exist, 'bad_vendor' if the vendor is unknown or inactive.
create or replace function update_request(
  p_id uuid,
  p_actor text,
  p_status text,
  p_set_vendor boolean,
  p_vendor_id uuid
) returns void
language plpgsql
set search_path = public
as $$
declare
  current_request requests%rowtype;
  old_vendor_name text;
  new_vendor_name text;
  new_vendor_active boolean;
begin
  -- Lock the row so two staff saving at once can't interleave.
  select * into current_request from requests where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;

  if p_status is not null and p_status is distinct from current_request.status then
    update requests set status = p_status where id = p_id;
    insert into request_events (request_id, actor, type, from_value, to_value)
    values (p_id, p_actor, 'status_changed', current_request.status, p_status);
  end if;

  if p_set_vendor and p_vendor_id is distinct from current_request.vendor_id then
    if p_vendor_id is not null then
      select name, active into new_vendor_name, new_vendor_active from vendors where id = p_vendor_id;
      if not found or not new_vendor_active then
        raise exception 'bad_vendor';
      end if;
    end if;
    select name into old_vendor_name from vendors where id = current_request.vendor_id;

    update requests set vendor_id = p_vendor_id where id = p_id;
    insert into request_events (request_id, actor, type, from_value, to_value)
    values (p_id, p_actor, 'assigned', old_vendor_name, new_vendor_name);
  end if;
end;
$$;

revoke execute on function update_request(uuid, text, text, boolean, uuid) from public, anon, authenticated;
grant execute on function update_request(uuid, text, text, boolean, uuid) to service_role;
