package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberAddrMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
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
public class MbMemberAddrService {

    private final MbMemberAddrMapper mbMemberAddrMapper;
    private final MbMemberAddrRepository mbMemberAddrRepository;

    @PersistenceContext
    private EntityManager em;

    public MbMemberAddrDto.Item getById(String id) {
        MbMemberAddrDto.Item dto = mbMemberAddrMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbMemberAddr findById(String id) {
        return mbMemberAddrRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbMemberAddrRepository.existsById(id);
    }

    public List<MbMemberAddrDto.Item> getList(MbMemberAddrDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbMemberAddrMapper.selectList(req);
    }

    public MbMemberAddrDto.PageResponse getPageData(MbMemberAddrDto.Request req) {
        PageHelper.addPaging(req);
        MbMemberAddrDto.PageResponse res = new MbMemberAddrDto.PageResponse();
        List<MbMemberAddrDto.Item> list = mbMemberAddrMapper.selectPageList(req);
        long count = mbMemberAddrMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbMemberAddr create(MbMemberAddr body) {
        body.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberAddr save(MbMemberAddr entity) {
        if (!existsById(entity.getMemberAddrId()))
            throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + entity.getMemberAddrId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberAddr update(String id, MbMemberAddr body) {
        MbMemberAddr entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberAddrId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberAddr updatePartial(MbMemberAddr entity) {
        if (entity.getMemberAddrId() == null) throw new CmBizException("memberAddrId 가 필요합니다.");
        if (!existsById(entity.getMemberAddrId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberAddrId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberAddrMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbMemberAddr entity = findById(id);
        mbMemberAddrRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<MbMemberAddr> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberAddrId() != null)
            .map(MbMemberAddr::getMemberAddrId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberAddrRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbMemberAddr> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberAddrId() != null)
            .toList();
        for (MbMemberAddr row : updateRows) {
            MbMemberAddr entity = findById(row.getMemberAddrId());
            VoUtil.voCopyExclude(row, entity, "memberAddrId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberAddrRepository.save(entity);
        }
        em.flush();

        List<MbMemberAddr> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberAddr row : insertRows) {
            row.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberAddrRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
