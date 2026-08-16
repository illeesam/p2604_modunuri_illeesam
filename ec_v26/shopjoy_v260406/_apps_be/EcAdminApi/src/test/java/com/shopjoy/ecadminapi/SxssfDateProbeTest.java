package com.shopjoy.ecadminapi;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/** 임시 진단용 — SXSSFWorkbook 의 setCompressTempFiles 여부가 zip 엔트리 날짜 손상의 원인인지 확인. 확인 후 삭제. */
class SxssfDateProbeTest {

    private byte[] build(boolean compressTemp) throws Exception {
        SXSSFWorkbook wb = new SXSSFWorkbook(100);
        wb.setCompressTempFiles(compressTemp);
        try {
            Sheet sheet = wb.createSheet("S1");
            for (int i = 0; i < 5; i++) {
                Row r = sheet.createRow(i);
                r.createCell(0).setCellValue("row" + i);
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        } finally {
            wb.dispose();
            wb.close();
        }
    }

    private void report(String label, byte[] bytes) throws Exception {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry e;
            while ((e = zis.getNextEntry()) != null) {
                zis.transferTo(java.io.OutputStream.nullOutputStream()); // 다음 getNextEntry() 전 완전히 소진
                System.out.println("[" + label + "] " + e.getName() + " time=" + e.getTime());
                zis.closeEntry();
            }
        }
    }

    @Test
    void probeCompressTrue() throws Exception {
        try { report("compressTemp=true ", build(true)); System.out.println("[RESULT] compressTemp=true  -> OK"); }
        catch (Exception e) { System.out.println("[RESULT] compressTemp=true  -> FAIL: " + e); }
    }

    @Test
    void probeCompressFalse() throws Exception {
        try { report("compressTemp=false", build(false)); System.out.println("[RESULT] compressTemp=false -> OK"); }
        catch (Exception e) { System.out.println("[RESULT] compressTemp=false -> FAIL: " + e); }
    }
}
