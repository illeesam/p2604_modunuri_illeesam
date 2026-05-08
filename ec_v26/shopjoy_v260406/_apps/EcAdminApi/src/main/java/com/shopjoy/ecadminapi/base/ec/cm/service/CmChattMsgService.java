package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmChattMsgMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattMsgRepository;
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
public class CmChattMsgService {

    private final CmChattMsgMapper cmChattMsgMapper;
    private final CmChattMsgRepository cmChattMsgRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public CmChattMsgDto getById(String id) {
        // cm_chatt_msg :: select one :: id [orm:mybatis]
        CmChattMsgDto result = cmChattMsgMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<CmChattMsgDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_chatt_msg :: select list :: p [orm:mybatis]
        List<CmChattMsgDto> result = cmChattMsgMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<CmChattMsgDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_chatt_msg :: select page :: [orm:mybatis]
        return PageResult.of(cmChattMsgMapper.selectPageList(p), cmChattMsgMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(CmChattMsg entity) {
        // cm_chatt_msg :: update :: [orm:mybatis]
        int result = cmChattMsgMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmChattMsg create(CmChattMsg entity) {
        entity.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_chatt_msg :: insert or update :: [orm:jpa]
        CmChattMsg result = cmChattMsgRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public CmChattMsg save(CmChattMsg entity) {
        if (!cmChattMsgRepository.existsById(entity.getChattMsgId()))
            throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + entity.getChattMsgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_chatt_msg :: insert or update :: [orm:jpa]
        CmChattMsg result = cmChattMsgRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!cmChattMsgRepository.existsById(id))
            throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + id);
        // cm_chatt_msg :: delete :: id [orm:jpa]
        cmChattMsgRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<CmChattMsg> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (CmChattMsg row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setChattMsgId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("cm_chatt_msg"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmChattMsgRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getChattMsgId(), "chattMsgId must not be null");
                CmChattMsg entity = cmChattMsgRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "chattMsgId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                cmChattMsgRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getChattMsgId(), "chattMsgId must not be null");
                if (cmChattMsgRepository.existsById(id)) cmChattMsgRepository.deleteById(id);
            }
        }
    }
}