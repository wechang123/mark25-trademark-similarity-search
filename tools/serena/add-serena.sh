#!/bin/bash
# 파일명: add-serena.sh

# Serena가 설치된 경로를 환경에 맞게 수정하세요
SERENA_PATH=~/development/serena

# 현재 디렉토리에 Serena MCP 추가
claude mcp add serena -- uv run --directory $SERENA_PATH serena-mcp-server --context ide-assistant

# 성공 메시지 출력
echo "✅ Serena MCP가 $(pwd) 프로젝트에 추가되었습니다"
echo "📌 Claude Code에서 /mcp__serena__initial_instructions 명령을 실행하세요"