package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleConfigMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleConfigRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
public class StSettleConfigService {


    private final StSettleConfigMapper stSettleConfigMapper;
    private final StSettleConfigRepository stSettleConfigRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public StSettleConfigDto getById(String id) {
        StSettleConfigDto result = stSettleConfigMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<StSettleConfigDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StSettleConfigDto> result = stSettleConfigMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<StSettleConfigDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stSettleConfigMapper.selectPageList(p), stSettleConfigMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(StSettleConfig entity) {
        int result = stSettleConfigMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StSettleConfig create(StSettleConfig entity) {
        entity.setSettleConfigId(CmUtil.generateId("st_settle_config"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleConfig result = stSettleConfigRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public StSettleConfig save(StSettleConfig entity) {
        if (!stSettleConfigRepository.existsById(entity.getSettleConfigId()))
            throw new CmBizException("존재하지 않는 StSettleConfig입니다: " + entity.getSettleConfigId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleConfig result = stSettleConfigRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        StSettleConfig entity = stSettleConfigRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stSettleConfigRepository.delete(entity);
        em.flush();
        if (stSettleConfigRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<StSettleConfig> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (StSettleConfig row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSettleConfigId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("st_settle_config"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stSettleConfigRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettleConfigId(), "settleConfigId must not be null");
                StSettleConfig entity = stSettleConfigRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "settleConfigId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                stSettleConfigRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettleConfigId(), "settleConfigId must not be null");
                if (stSettleConfigRepository.existsById(id)) stSettleConfigRepository.deleteById(id);
            }
        }
        em.flush();
    }
}