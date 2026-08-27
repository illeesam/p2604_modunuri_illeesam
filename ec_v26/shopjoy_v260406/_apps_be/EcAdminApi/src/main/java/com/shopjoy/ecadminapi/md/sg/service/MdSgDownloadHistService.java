package com.shopjoy.ecadminapi.md.sg.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgDownloadHistDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgDownloadHist;
import com.shopjoy.ecadminapi.md.sg.repository.MdSgDownloadHistRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MdSgDownloadHist — 소스젠 FO 화면 [⬇ ZIP 다운로드] 클릭 기록.
 * 파일 자체는 재보관하지 않고 클릭 로그만 남긴다(BO 에서 조회만, 재다운로드 기능 없음).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdSgDownloadHistService {

    private final MdSgDownloadHistRepository mdSgDownloadHistRepository;

    @PersistenceContext
    private EntityManager em;

    public List<MdSgDownloadHistDto.Item> getList(MdSgDownloadHistDto.Request req) {
        // [QueryDSL] 소스젠 ZIP 다운로드 클릭 기록 — 파일 재보관 없이 로그만 남긴다 목록 조회
        return mdSgDownloadHistRepository.selectList(req);
    }

    public BasePage<MdSgDownloadHistDto.Item> getPageData(MdSgDownloadHistDto.Request req) {
        // [QueryDSL] 소스젠 ZIP 다운로드 클릭 기록 — 파일 재보관 없이 로그만 남긴다 페이지 조회
        return mdSgDownloadHistRepository.selectPageData(req);
    }

    /** create — FO [⬇ ZIP 다운로드] 클릭 시 1건 기록 (로그 성격 — 실패해도 다운로드 자체는 막지 않는다) */
    @Transactional
    public MdSgDownloadHist create(MdSgDownloadHist body) {
        body.setDownloadHistId(CmUtil.generateId("sg_dlhist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 ZIP 다운로드 클릭 기록 — 파일 재보관 없이 로그만 남긴다 저장
        MdSgDownloadHist saved = mdSgDownloadHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** delete — BO 관리자가 오래된 로그를 정리할 때 사용 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        // [쿼리 메서드] 소스젠 ZIP 다운로드 클릭 기록 — 파일 재보관 없이 로그만 남긴다 단건 조회
        MdSgDownloadHist entity = mdSgDownloadHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        // [쿼리 메서드] 소스젠 ZIP 다운로드 클릭 기록 — 파일 재보관 없이 로그만 남긴다 삭제
        mdSgDownloadHistRepository.delete(entity);
        em.flush();
    }
}
