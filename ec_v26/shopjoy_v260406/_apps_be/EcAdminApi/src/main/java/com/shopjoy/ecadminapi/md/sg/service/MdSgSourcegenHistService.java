package com.shopjoy.ecadminapi.md.sg.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgSourcegenHistDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegenHist;
import com.shopjoy.ecadminapi.md.sg.repository.MdSgSourcegenHistRepository;
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
        return mdSgSourcegenHistRepository.selectPageData(req);
    }

    public List<MdSgSourcegenHistDto.Item> getByProjectId(String projectId) {
        CmUtil.requireId(projectId, "projectId", this);
        MdSgSourcegenHistDto.Request req = new MdSgSourcegenHistDto.Request();
        req.setProjectId(projectId);
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
        MdSgSourcegenHist saved = mdSgSourcegenHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MdSgSourcegenHist entity = mdSgSourcegenHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        mdSgSourcegenHistRepository.delete(entity);
        em.flush();
    }
}
