package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberGradeMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGradeRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbMemberGradeService {

    private final MbMemberGradeMapper mbMemberGradeMapper;
    private final MbMemberGradeRepository mbMemberGradeRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public MbMemberGradeDto getById(String id) {
        MbMemberGradeDto result = mbMemberGradeMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<MbMemberGradeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbMemberGradeDto> result = mbMemberGradeMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<MbMemberGradeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbMemberGradeMapper.selectPageList(p), mbMemberGradeMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(MbMemberGrade entity) {
        int result = mbMemberGradeMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbMemberGrade create(MbMemberGrade entity) {
        entity.setMemberGradeId(CmUtil.generateId("mb_member_grade"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGrade result = mbMemberGradeRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public MbMemberGrade save(MbMemberGrade entity) {
        if (!mbMemberGradeRepository.existsById(entity.getMemberGradeId()))
            throw new CmBizException("존재하지 않는 MbMemberGrade입니다: " + entity.getMemberGradeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGrade result = mbMemberGradeRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!mbMemberGradeRepository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMemberGrade입니다: " + id);
        mbMemberGradeRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<MbMemberGrade> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (MbMemberGrade row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setMemberGradeId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("mb_member_grade"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberGradeRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberGradeId(), "memberGradeId must not be null");
                MbMemberGrade entity = mbMemberGradeRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "memberGradeId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                mbMemberGradeRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberGradeId(), "memberGradeId must not be null");
                if (mbMemberGradeRepository.existsById(id)) mbMemberGradeRepository.deleteById(id);
            }
        }
    }
}