package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdDlivMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
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
public class OdDlivService {

    private final OdDlivMapper odDlivMapper;
    private final OdDlivRepository odDlivRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdDlivDto getById(String id) {
        OdDlivDto result = odDlivMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<OdDlivDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdDlivDto> result = odDlivMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<OdDlivDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odDlivMapper.selectPageList(p), odDlivMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdDliv entity) {
        int result = odDlivMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdDliv create(OdDliv entity) {
        entity.setDlivId(CmUtil.generateId("od_dliv"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv result = odDlivRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdDliv save(OdDliv entity) {
        if (!odDlivRepository.existsById(entity.getDlivId()))
            throw new CmBizException("존재하지 않는 OdDliv입니다: " + entity.getDlivId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv result = odDlivRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odDlivRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdDliv입니다: " + id);
        odDlivRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdDliv> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdDliv row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setDlivId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_dliv"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odDlivRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getDlivId(), "dlivId must not be null");
                OdDliv entity = odDlivRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "dlivId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odDlivRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getDlivId(), "dlivId must not be null");
                if (odDlivRepository.existsById(id)) odDlivRepository.deleteById(id);
            }
        }
    }
}