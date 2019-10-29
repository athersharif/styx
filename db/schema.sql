--
-- PostgreSQL database dump
--

-- Dumped from database version 12.0 (Debian 12.0-2.pgdg100+1)
-- Dumped by pg_dump version 12.0 (Debian 12.0-2.pgdg100+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: styx_test_table; Type: TABLE; Schema: public; Owner: styx_admin
--

CREATE TABLE public.styx_test_table (
    id integer NOT NULL,
    some_text text,
    some_bool boolean DEFAULT false,
    some_num smallint
);


ALTER TABLE public.styx_test_table OWNER TO styx_admin;

--
-- Name: styx_test_table_id_seq; Type: SEQUENCE; Schema: public; Owner: styx_admin
--

CREATE SEQUENCE public.styx_test_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.styx_test_table_id_seq OWNER TO styx_admin;

--
-- Name: styx_test_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: styx_admin
--

ALTER SEQUENCE public.styx_test_table_id_seq OWNED BY public.styx_test_table.id;


--
-- Name: styx_test_table id; Type: DEFAULT; Schema: public; Owner: styx_admin
--

ALTER TABLE ONLY public.styx_test_table ALTER COLUMN id SET DEFAULT nextval('public.styx_test_table_id_seq'::regclass);


--
-- Name: styx_test_table styx_test_table_pkey; Type: CONSTRAINT; Schema: public; Owner: styx_admin
--

ALTER TABLE ONLY public.styx_test_table
    ADD CONSTRAINT styx_test_table_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

