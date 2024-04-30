CREATE TABLE app."nodeLinks" (
    id text NOT NULL COLLATE pg_catalog."C",
    creator text NOT NULL,
    "createdAt" bigint NOT NULL,
    parent text NOT NULL,
    child text NOT NULL,
    form text,
    "seriesAnchor" boolean,
    "seriesEnd" boolean,
    polarity text,
    "c_parentType" text NOT NULL,
    "c_childType" text NOT NULL,
    "group" text DEFAULT 'generic'::text NOT NULL,
    "orderKey" text DEFAULT '0|Vzzzzz:'::text NOT NULL COLLATE pg_catalog."C",
	"c_accessPolicyTargets" text[] NOT NULL
);
ALTER TABLE ONLY app."nodeLinks" ADD CONSTRAINT "v1_draft_nodeLinks_pkey" PRIMARY KEY (id);
ALTER TABLE app."nodeLinks" DROP CONSTRAINT IF EXISTS "c_accessPolicyTargets_check", ADD CONSTRAINT "c_accessPolicyTargets_check" CHECK (cardinality("c_accessPolicyTargets") > 0);

CREATE INDEX nodelinks_parent_child ON app."nodeLinks" USING btree (parent, child);

-- extra index for RLS-friendly view
DROP INDEX IF EXISTS node_link_access_idx;
CREATE INDEX node_link_access_idx ON app."nodeLinks" USING gin ("c_accessPolicyTargets");

-- field collation fixes (ideal would be to, database-wide, have collation default to case-sensitive, but for now we just do it for a few key fields for which "ORDER BY" clauses exist)
ALTER TABLE app."nodeLinks" ALTER COLUMN "orderKey" SET DATA TYPE TEXT COLLATE "C";
ALTER TABLE app."nodeLinks" ALTER COLUMN "id" SET DATA TYPE TEXT COLLATE "C";

CREATE OR REPLACE VIEW app.my_node_links WITH (security_barrier=off)
    AS WITH q1 AS (
        SELECT array_agg(concat(id, ':nodes')) AS pol
        FROM app."accessPolicies"
        WHERE is_user_admin(current_setting('app.current_user_id')) OR coalesce(("permissions_userExtends" -> current_setting('app.current_user_id') -> 'nodes' -> 'access')::boolean,
            ("permissions" -> 'nodes' -> 'access')::boolean))
        SELECT app."nodeLinks".* FROM app."nodeLinks" JOIN q1 ON (
            ("c_accessPolicyTargets" && q1.pol));