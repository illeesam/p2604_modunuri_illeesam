package com.shopjoy.ecadminapi.md.cb.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbPatternDto;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPattern;
import com.shopjoy.ecadminapi.md.cb.repository.MdCbPatternRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdCbPatternService {

    private final MdCbPatternRepository mdCbPatternRepository;

    @PersistenceContext
    private EntityManager em;

    public MdCbPatternDto.Item getById(String id) {
        MdCbPatternDto.Item dto = mdCbPatternRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public MdCbPattern findById(String id) {
        return mdCbPatternRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        return mdCbPatternRepository.existsById(id);
    }

    public List<MdCbPatternDto.Item> getList(MdCbPatternDto.Request req) {
        return mdCbPatternRepository.selectList(req);
    }

    public BasePage<MdCbPatternDto.Item> getPageData(MdCbPatternDto.Request req) {
        PageHelper.addPaging(req);
        return mdCbPatternRepository.selectPageData(req);
    }

    @Transactional
    public MdCbPattern create(MdCbPattern body) {
        body.setPatternId(CmUtil.generateId("cb_pattern"));
        if (body.getPatternStatusCd() == null) body.setPatternStatusCd("DRAFT");
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MdCbPattern saved = mdCbPatternRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MdCbPattern update(String id, MdCbPattern body) {
        CmUtil.requireId(id, "id", this);
        MdCbPattern entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "patternId^memberId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MdCbPattern saved = mdCbPatternRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MdCbPattern entity = findById(id);
        mdCbPatternRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
