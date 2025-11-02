package com.nexhubstudio.backend.config;

import com.p6spy.engine.logging.Category;
import com.p6spy.engine.spy.appender.MessageFormattingStrategy;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * P6Spy 커스텀 포맷터 - SQL을 예쁘게 멀티라인으로 출력
 */
public class P6SpyPrettyFormatter implements MessageFormattingStrategy {

    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category, String prepared,
            String sql, String url) {
        if (sql == null || sql.trim().isEmpty()) {
            return "";
        }

        // statement 카테고리만 처리
        if (!Category.STATEMENT.getName().equals(category)) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append(
                "====================================================================================================\n");
        sb.append("  [").append(dateFormat.format(new Date())).append("]");
        sb.append(" | Execution Time: ").append(elapsed).append("ms");
        sb.append(" | Connection: ").append(connectionId);
        sb.append("\n");
        sb.append(
                "====================================================================================================\n");

        // SQL 포맷팅 - SELECT, FROM, WHERE, JOIN 등을 줄바꿈
        String formattedSql = formatSql(sql.trim());
        sb.append(formattedSql);

        sb.append("\n");
        sb.append(
                "====================================================================================================\n");

        return sb.toString();
    }

    /**
     * SQL을 예쁘게 포맷팅
     */
    private String formatSql(String sql) {
        // 먼저 콤마로 컬럼 분리
        String formatted = sql;

        // SELECT 절의 컬럼들을 줄바꿈
        if (formatted.toUpperCase().contains("SELECT") && formatted.toUpperCase().contains("FROM")) {
            int selectIndex = formatted.toUpperCase().indexOf("SELECT");
            int fromIndex = formatted.toUpperCase().indexOf("FROM");

            if (selectIndex >= 0 && fromIndex > selectIndex) {
                String selectPart = formatted.substring(selectIndex + 6, fromIndex).trim();
                String[] columns = selectPart.split(",");

                StringBuilder selectFormatted = new StringBuilder("SELECT\n");
                for (int i = 0; i < columns.length; i++) {
                    selectFormatted.append("  ").append(columns[i].trim());
                    if (i < columns.length - 1) {
                        selectFormatted.append(",");
                    }
                    selectFormatted.append("\n");
                }

                formatted = selectFormatted.toString() + "FROM" + formatted.substring(fromIndex + 4);
            }
        }

        // 기본 키워드 포맷팅
        formatted = formatted
                .replaceAll("(?i)\\bFROM\\b", "\nFROM\n  ")
                .replaceAll("(?i)\\bWHERE\\b", "\nWHERE\n  ")
                .replaceAll("(?i)\\bAND\\b", "\n  AND ")
                .replaceAll("(?i)\\bOR\\b", "\n  OR ")
                .replaceAll("(?i)\\bJOIN\\b", "\nJOIN\n  ")
                .replaceAll("(?i)\\bLEFT\\s+JOIN\\b", "\nLEFT JOIN\n  ")
                .replaceAll("(?i)\\bRIGHT\\s+JOIN\\b", "\nRIGHT JOIN\n  ")
                .replaceAll("(?i)\\bINNER\\s+JOIN\\b", "\nINNER JOIN\n  ")
                .replaceAll("(?i)\\bON\\b", "\n  ON ")
                .replaceAll("(?i)\\bORDER\\s+BY\\b", "\nORDER BY\n  ")
                .replaceAll("(?i)\\bGROUP\\s+BY\\b", "\nGROUP BY\n  ")
                .replaceAll("(?i)\\bHAVING\\b", "\nHAVING\n  ")
                .replaceAll("(?i)\\bLIMIT\\b", "\nLIMIT ")
                .replaceAll("(?i)\\bOFFSET\\b", "\nOFFSET ")
                .replaceAll("(?i)\\bINSERT\\s+INTO\\b", "\nINSERT INTO\n  ")
                .replaceAll("(?i)\\bVALUES\\b", "\nVALUES\n  ")
                .replaceAll("(?i)\\bUPDATE\\b", "\nUPDATE\n  ")
                .replaceAll("(?i)\\bSET\\b", "\nSET\n  ")
                .replaceAll("(?i)\\bDELETE\\s+FROM\\b", "\nDELETE FROM\n  ");

        return formatted.trim();
    }
}
