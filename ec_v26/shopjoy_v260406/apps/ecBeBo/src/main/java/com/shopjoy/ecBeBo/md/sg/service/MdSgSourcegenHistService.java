package com.shopjoy.ecBeBo.md.sg.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgSourcegenHistDto;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgSourcegenHist;
import com.shopjoy.ecBeBo.md.sg.repository.MdSgSourcegenHistRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MdSgSourcegenHist — 소스 생성 이력. 생성 결과 ZIP 은 공통 업로드 API(/co/cm/upload/multi)로 먼저 올리고,
 * 그 결과 attachId 를 여기에 기록해 "DB 에 첨부 형식으로 보관"한다(파일 실체는 sy_attach 가 관리).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdSgSourcegenHistService {

    private final MdSgSourcegenHistRepository mdSgSourcegenHistRepository;

    @PersistenceContext
    private EntityManager em;

    /** getPageData — 소스젠 경계를 넘는 전체 생성이력 조회(이력 화면용) */
    public BasePage<MdSgSourcegenHistDto.Item> getPageData(MdSgSourcegenHistDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관 페이지 조회
        return mdSgSourcegenHistRepository.selectPageData(req);
    }

    public List<MdSgSourcegenHistDto.Item> getByProjectId(String projectId) {
        CmUtil.requireId(projectId, "projectId", this);
        MdSgSourcegenHistDto.Request req = new MdSgSourcegenHistDto.Request();
        req.setProjectId(projectId);
        // [QueryDSL] 소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관 목록 조회
        return mdSgSourcegenHistRepository.selectList(req);
    }

    @Transactional
    public MdSgSourcegenHist create(String projectId, MdSgSourcegenHist body) {
        CmUtil.requireId(projectId, "projectId", this);
        body.setSourcegenHistId(CmUtil.generateId("sg_sourcegen_hist"));
        body.setProjectId(projectId);
        if (body.getGenDate() == null) body.setGenDate(LocalDateTime.now());
        if (body.getUseYn() == null) body.setUseYn("Y");
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관 저장
        MdSgSourcegenHist saved = mdSgSourcegenHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** incrementDownloadCount — 생성 이력 그리드의 [다운로드] 클릭마다 호출(2026-08-30).
     *  로그성 카운터라 실패해도 다운로드 자체를 막지 않는다(호출부에서 실패를 무시). */
    @Transactional
    public int incrementDownloadCount(String id) {
        CmUtil.requireId(id, "id", this);
        // [쿼리 메서드] 소스젠 생성 이력 단건 조회
        MdSgSourcegenHist entity = mdSgSourcegenHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        int next = (entity.getDownloadCount() == null ? 0 : entity.getDownloadCount()) + 1;
        entity.setDownloadCount(next);
        // [쿼리 메서드] 소스젠 생성 이력 저장
        mdSgSourcegenHistRepository.save(entity);
        em.flush();
        return next;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        // [쿼리 메서드] 소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관 단건 조회
        MdSgSourcegenHist entity = mdSgSourcegenHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        // [쿼리 메서드] 소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관 삭제
        mdSgSourcegenHistRepository.delete(entity);
        em.flush();
    }
}
