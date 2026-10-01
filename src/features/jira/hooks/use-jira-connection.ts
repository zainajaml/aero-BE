import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/shared/api/errors";
import { config } from "@/shared/config/env";
import { disconnectJira, selectJiraSite, startJiraConnect } from "../api/jira.api";
import { jiraKeys, jiraProjectsQuery, jiraSitesQuery, jiraStatusQuery } from "./jira-queries";

const OAUTH_MESSAGE_SOURCE = "spacescope-jira-oauth";
const CONNECT_FAILED = "We couldn't connect to Jira. Please try again.";

/**
 * Jira connection state: status, sites and projects, the Atlassian OAuth popup and the
 * site switch / disconnect actions. `onReset` clears page state tied to the old connection.
 */
export function useJiraConnection(onReset: () => void) {
  const queryClient = useQueryClient();
  const jiraAuthWindow = useRef<Window | null>(null);
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  const statusQuery = useQuery(jiraStatusQuery());
  const connected = statusQuery.data?.connected === true;
  const jiraProjects = useQuery(jiraProjectsQuery(connected));
  const sitesQuery = useQuery(jiraSitesQuery(statusQuery.data?.cloudId ?? null, connected));
  const refetchStatus = statusQuery.refetch;

  useEffect(() => {
    const apiOrigin = new URL(config.apiUrl || window.location.origin).origin;
    const refreshConnection = () => {
      if (document.visibilityState === "visible") void refetchStatus();
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== apiOrigin) return;
      const data = e.data as { source?: string; status?: string } | null;
      if (data?.source !== OAUTH_MESSAGE_SOURCE) return;
      if (data.status === "connected") {
        onResetRef.current();
        void queryClient.resetQueries({ queryKey: jiraKeys.projects() });
        void queryClient.resetQueries({ queryKey: jiraKeys.sites() });
        void refetchStatus();
      } else {
        toast.error(CONNECT_FAILED);
      }
    };
    window.addEventListener("focus", refreshConnection);
    window.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", refreshConnection);
    return () => {
      window.removeEventListener("focus", refreshConnection);
      window.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", refreshConnection);
    };
  }, [refetchStatus, queryClient]);

  // The non-popup fallback returns to /jira?jira=connected|error.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("jira");
    if (!result) return;
    if (result === "error") toast.error(CONNECT_FAILED);
    else void refetchStatus();
    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useMutation({
    mutationFn: startJiraConnect,
    onSuccess: (res) => {
      const w = jiraAuthWindow.current;
      jiraAuthWindow.current = null;
      if (w && !w.closed) {
        try {
          // The blank tab is same-origin, so writing a redirect document into it
          // works even when the app itself runs inside a preview frame.
          w.document.open();
          w.document.write(
            `<!doctype html><meta charset="utf-8"><title>Connecting to Jira…</title>` +
              `<meta http-equiv="refresh" content="0;url=${res.authorizeUrl.replace(/"/g, "&quot;")}">` +
              `<p style="font:14px system-ui;padding:24px">Redirecting to Atlassian…</p>`,
          );
          w.document.close();
          return;
        } catch {
          w.close();
        }
      }
      const opened = window.open(res.authorizeUrl, "_blank");
      if (!opened) toast.error("Allow pop-ups for SpaceScope, then try connecting Jira again.");
    },
    onError: () => {
      jiraAuthWindow.current?.close();
      jiraAuthWindow.current = null;
      toast.error(CONNECT_FAILED);
    },
  });

  const connectToJira = () => {
    jiraAuthWindow.current = window.open("about:blank", "_blank");
    connect.mutate();
  };

  const switchSite = useMutation({
    mutationFn: selectJiraSite,
    onSuccess: async () => {
      onResetRef.current();
      queryClient.removeQueries({ queryKey: jiraKeys.projects() });
      await refetchStatus();
      await jiraProjects.refetch();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const disconnect = useMutation({
    mutationFn: disconnectJira,
    onSuccess: async () => {
      onResetRef.current();
      queryClient.removeQueries({ queryKey: jiraKeys.projects() });
      queryClient.removeQueries({ queryKey: jiraKeys.sites() });
      await refetchStatus();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return {
    statusQuery,
    connected,
    jiraProjects,
    sitesQuery,
    connect,
    connectToJira,
    switchSite,
    disconnect,
  };
}
