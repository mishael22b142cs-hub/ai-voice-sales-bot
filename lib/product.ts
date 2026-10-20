// Edit this file to point the bot at whatever SaaS product you want it to sell.
export const PRODUCT = {
  name: "FlowDesk",
  tagline: "The all-in-one project management platform for fast-moving teams",
  description:
    "FlowDesk is a SaaS project management tool that combines task boards, team chat, " +
    "time tracking, and automated status reports in one place. It replaces the need for " +
    "separate tools like Trello, Slack, and Toggl.",
  keyFeatures: [
    "Drag-and-drop Kanban boards with unlimited projects",
    "Built-in team chat and @mentions on tasks",
    "Automatic time tracking per task and per teammate",
    "One-click weekly status reports for stakeholders",
    "Integrates with Slack, Google Drive, and GitHub",
  ],
  pricing: [
    { plan: "Starter", price: "$9/user/month", notes: "Up to 10 users, core features" },
    { plan: "Pro", price: "$19/user/month", notes: "Unlimited users, automations, integrations" },
    { plan: "Enterprise", price: "Custom pricing", notes: "SSO, dedicated support, custom SLAs" },
  ],
  commonObjections: [
    { objection: "We already use Trello/Asana", response: "Highlight built-in chat + time tracking that removes 2 other subscriptions" },
    { objection: "Too expensive", response: "Offer a 14-day free trial and point to the Starter plan" },
    { objection: "Team is too small for this", response: "Mention Starter plan is designed for small teams, scales as they grow" },
  ],
  trialOffer: "a free 14-day trial, no credit card required",
};
