package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberGradeMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGradeRepository;
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
public class MbMemberGradeService {

    private final MbMemberGradeMapper mbMemberGradeMapper;
    private final MbMemberGradeRepository mbMemberGradeRepository;

    @PersistenceContext
    private EntityManager em;

    public MbMemberGradeDto.Item getById(String id) {
        MbMemberGradeDto.Item dto = mbMemberGradeMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbMemberGrade findById(String id) {
        return mbMemberGradeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbMemberGradeRepository.existsById(id);
    }

    public List<MbMemberGradeDto.Item> getList(MbMemberGradeDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbMemberGradeMapper.selectList(req);
    }

    public MbMemberGradeDto.PageResponse getPageData(MbMemberGradeDto.Request req) {
        PageHelper.addPaging(req);
        MbMemberGradeDto.PageResponse res = new MbMemberGradeDto.PageResponse();
        List<MbMemberGradeDto.Item> list = mbMemberGradeMapper.selectPageList(req);
        long count = mbMemberGradeMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbMemberGrade create(MbMemberGrade body) {
        body.setMemberGradeId(CmUtil.generateId("mb_member_grade"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberGrade saved = mbMemberGradeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getMemberGradeId());
    }

    @Transactional
    public MbMemberGrade save(MbMemberGrade entity) {
        if (!existsById(entity.getMemberGradeId()))
            throw new CmBizException("존재하지 않는 MbMemberGrade입니다: " + entity.getMemberGradeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGrade saved = mbMemberGradeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getMemberGradeId());
    }

    @Transactional
    public MbMemberGrade update(String id, MbMemberGrade body) {
        MbMemberGrade entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberGradeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGrade saved = mbMemberGradeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public MbMemberGrade updatePartial(MbMemberGrade entity) {
        if (entity.getMemberGradeId() == null) throw new CmBizException("memberGradeId 가 필요합니다.");
        if (!existsById(entity.getMemberGradeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberGradeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberGradeMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getMemberGradeId());
    }

    @Transactional
    public void delete(String id) {
        MbMemberGrade entity = findById(id);
        mbMemberGradeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<MbMemberGrade> saveList(List<MbMemberGrade> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberGradeId() != null)
            .map(MbMemberGrade::getMemberGradeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberGradeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<MbMemberGrade> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberGradeId() != null)
            .toList();
        for (MbMemberGrade row : updateRows) {
            MbMemberGrade entity = findById(row.getMemberGradeId());
            VoUtil.voCopyExclude(row, entity, "memberGradeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberGradeRepository.save(entity);
            upsertedIds.add(entity.getMemberGradeId());
        }
        em.flush();

        List<MbMemberGrade> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberGrade row : insertRows) {
            row.setMemberGradeId(CmUtil.generateId("mb_member_grade"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberGradeRepository.save(row);
            upsertedIds.add(row.getMemberGradeId());
        }
        em.flush();
        em.clear();

        List<MbMemberGrade> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
