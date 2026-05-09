package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBbsMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbsRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyBbsService {

    private final SyBbsMapper syBbsMapper;
    private final SyBbsRepository syBbsRepository;

    @PersistenceContext
    private EntityManager em;

    public SyBbsDto.Item getById(String id) {
        SyBbsDto.Item dto = syBbsMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyBbs findById(String id) {
        return syBbsRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syBbsRepository.existsById(id);
    }

    public List<SyBbsDto.Item> getList(SyBbsDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syBbsMapper.selectList(VoUtil.voToMap(req));
    }

    public SyBbsDto.PageResponse getPageData(SyBbsDto.Request req) {
        PageHelper.addPaging(req);
        SyBbsDto.PageResponse res = new SyBbsDto.PageResponse();
        List<SyBbsDto.Item> list = syBbsMapper.selectPageList(VoUtil.voToMap(req));
        long count = syBbsMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyBbs create(SyBbs body) {
        body.setBbsId(CmUtil.generateId("sy_bbs"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBbs save(SyBbs entity) {
        if (!existsById(entity.getBbsId()))
            throw new CmBizException("존재하지 않는 SyBbs입니다: " + entity.getBbsId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBbs update(String id, SyBbs body) {
        SyBbs entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bbsId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBbs updatePartial(SyBbs entity) {
        if (entity.getBbsId() == null) throw new CmBizException("bbsId 가 필요합니다.");
        if (!existsById(entity.getBbsId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBbsId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBbsMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyBbs entity = findById(id);
        syBbsRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyBbs> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBbsId() != null)
            .map(SyBbs::getBbsId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syBbsRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyBbs> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBbsId() != null)
            .toList();
        for (SyBbs row : updateRows) {
            SyBbs entity = findById(row.getBbsId());
            VoUtil.voCopyExclude(row, entity, "bbsId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syBbsRepository.save(entity);
        }
        em.flush();

        List<SyBbs> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyBbs row : insertRows) {
            row.setBbsId(CmUtil.generateId("sy_bbs"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syBbsRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
