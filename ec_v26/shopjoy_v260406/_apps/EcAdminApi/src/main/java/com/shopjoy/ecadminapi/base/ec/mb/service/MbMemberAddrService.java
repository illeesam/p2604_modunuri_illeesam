package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberAddrMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
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
public class MbMemberAddrService {

    private final MbMemberAddrMapper mbMemberAddrMapper;
    private final MbMemberAddrRepository mbMemberAddrRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbMemberAddrDto getById(String id) {
        MbMemberAddrDto result = mbMemberAddrMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<MbMemberAddrDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbMemberAddrDto> result = mbMemberAddrMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<MbMemberAddrDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbMemberAddrMapper.selectPageList(p), mbMemberAddrMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(MbMemberAddr entity) {
        int result = mbMemberAddrMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbMemberAddr create(MbMemberAddr entity) {
        entity.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr result = mbMemberAddrRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public MbMemberAddr save(MbMemberAddr entity) {
        if (!mbMemberAddrRepository.existsById(entity.getMemberAddrId()))
            throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + entity.getMemberAddrId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr result = mbMemberAddrRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!mbMemberAddrRepository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + id);
        mbMemberAddrRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<MbMemberAddr> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (MbMemberAddr row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setMemberAddrId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("mb_member_addr"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberAddrRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberAddrId(), "memberAddrId must not be null");
                MbMemberAddr entity = mbMemberAddrRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "memberAddrId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                mbMemberAddrRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberAddrId(), "memberAddrId must not be null");
                if (mbMemberAddrRepository.existsById(id)) mbMemberAddrRepository.deleteById(id);
            }
        }
    }
}