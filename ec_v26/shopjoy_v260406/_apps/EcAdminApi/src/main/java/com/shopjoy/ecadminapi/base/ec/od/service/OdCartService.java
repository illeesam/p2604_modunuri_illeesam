package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdCartMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdCartRepository;
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
public class OdCartService {

    private final OdCartMapper odCartMapper;
    private final OdCartRepository odCartRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdCartDto getById(String id) {
        OdCartDto result = odCartMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdCartDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdCartDto> result = odCartMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdCartDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odCartMapper.selectPageList(p), odCartMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdCart entity) {
        int result = odCartMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdCart create(OdCart entity) {
        entity.setCartId(CmUtil.generateId("od_cart"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdCart result = odCartRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdCart save(OdCart entity) {
        if (!odCartRepository.existsById(entity.getCartId()))
            throw new CmBizException("존재하지 않는 OdCart입니다: " + entity.getCartId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdCart result = odCartRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odCartRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdCart입니다: " + id);
        odCartRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdCart> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdCart row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCartId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_cart"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odCartRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCartId(), "cartId must not be null");
                OdCart entity = odCartRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "cartId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odCartRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCartId(), "cartId must not be null");
                if (odCartRepository.existsById(id)) odCartRepository.deleteById(id);
            }
        }
    }
}