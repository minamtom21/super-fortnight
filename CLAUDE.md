# Working agreement: Claude plans and reviews, Codex implements

Follow this flow for every request.

1. **Plan (Claude)**: When a request comes in, Claude first designs the plan: the goal, the deliverables, how to build it, what to check before calling it done, and the risks.
2. **Implement (Codex)**: Hand all hands-on work (writing code, creating files, editing) to Codex via the `/codex:rescue` command or the Codex companion script. Give Codex the plan, the target files, and the acceptance criteria explicitly.
3. **Review (Claude)**: Claude reviews what Codex produced (you can use `/codex:review` and the like as a supplement). If there's a problem, point out what needs to change and send it back to Codex.
4. **Done**: Repeat step 3 until no problems remain. Report only the finished result to the user: what you made, how you verified it, and anything left open.

Notes
- In principle Claude does not write code itself. The exceptions are minimal operations needed for review (running tests, reading the diff).
- Don't report intermediate drafts. But if a blocker comes up (a spec question, an environment limit), ask the user immediately.
- Power Apps work is delivered as `.msapp` files that open directly in Power Apps.
