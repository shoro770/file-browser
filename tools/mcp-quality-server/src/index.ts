import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { checkBundleBudget, verifyTreeNodeId, type CheckResult } from './checks.ts'

// stdout carries the JSON-RPC stream: never write to it. Log with console.error only.

/**
 * Converts a check result into an MCP tool response; failures set `isError`.
 * @param result - The outcome of a guardrail check.
 * @returns The MCP tool result.
 */
function toToolResult(result: CheckResult) {
  return { content: [{ type: 'text' as const, text: result.message }], isError: !result.ok }
}

const server = new McpServer({ name: 'file-browser-quality', version: '0.0.0' })

server.registerTool(
  'verify_tree_node_id',
  {
    description:
      'Verifies a file-tree node id is deterministic: it must equal the slash-joined path from the root (e.g. "src/a.ts"). Rejects UUIDs, Math.random() values and timestamps.',
    inputSchema: {
      nodeId: z.string().describe('The id assigned to the tree node'),
      filePath: z.string().describe('Slash-joined path of the entry from the root'),
    },
  },
  ({ nodeId, filePath }) => toToolResult(verifyTreeNodeId(nodeId, filePath)),
)

server.registerTool(
  'check_bundle_budget',
  {
    description:
      'Checks the initial JavaScript size (gzipped KB, from `vite build`) against the 150 KB hard budget and reports the remaining headroom.',
    inputSchema: {
      sizeInKb: z.number().describe('Gzipped initial JS size in KB'),
    },
  },
  ({ sizeInKb }) => toToolResult(checkBundleBudget(sizeInKb)),
)

await server.connect(new StdioServerTransport())
console.error('file-browser-quality MCP server running on stdio')
